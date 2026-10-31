import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

describe('Noise suppression iframe API commands and events', () => {
    let p1: Participant;

    /**
     * Reads the noise suppression state in the iframe: the redux flag and whether an effect is set on the local
     * audio track. Without a local audio track only the flag is updated, so the effect has to be checked as well.
     */
    async function getNoiseSuppressionState(): Promise<{ effectOnTrack: boolean; enabled: boolean; }> {
        await p1.switchToIFrame();

        return p1.execute(() => {
            const state = APP.store.getState();
            const localAudio = state['features/base/tracks'].find((t: any) => t.local && t.mediaType === 'audio');

            return {
                effectOnTrack: Boolean((localAudio?.jitsiTrack as any)?._streamEffect),
                enabled: state['features/noise-suppression'].enabled
            };
        });
    }

    /**
     * Waits for noise suppression to be enabled or disabled, both in redux and on the local audio track.
     *
     * @param expected Whether noise suppression is expected to be enabled.
     * @param timeoutMsg The message to fail with.
     */
    async function waitForNoiseSuppression(expected: boolean, timeoutMsg: string) {
        await p1.driver.waitUntil(
            async () => {
                const { effectOnTrack, enabled } = await getNoiseSuppressionState();

                return enabled === expected && effectOnTrack === expected;
            },
            {
                timeout: 10_000,
                timeoutMsg
            });
    }

    /**
     * Puts noise suppression in a known state, so that every case is independent of the previous ones and of the
     * state persisted in local storage. Clears the noiseSuppressionChanged event result afterwards.
     *
     * @param enabled Whether noise suppression should be enabled.
     */
    async function setInitialState(enabled: boolean) {
        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand('setNoiseSuppressionEnabled', { enabled });
        await waitForNoiseSuppression(enabled, `Could not ${enabled ? 'enable' : 'disable'} noise suppression`);

        await p1.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('noiseSuppressionChanged');
    }

    /**
     * Waits for the noiseSuppressionChanged event with the expected enabled value.
     *
     * @param expected The expected enabled value.
     * @param command The command which is expected to have triggered the event.
     */
    async function waitForChangedEvent(expected: boolean, command: string) {
        await p1.switchToMainFrame();
        await p1.driver.waitUntil(
            async () => (await p1.getIframeAPI().getEventResult('noiseSuppressionChanged'))?.enabled === expected,
            {
                timeout: 10_000,
                timeoutMsg: `noiseSuppressionChanged event (enabled: ${expected}) was not received for ${command}`
            });
    }

    /**
     * Executes the given iframe API command and checks that noise suppression ends up in the expected state and that
     * the noiseSuppressionChanged event is fired.
     *
     * @param command The iframe API command to execute.
     * @param expected Whether noise suppression is expected to be enabled afterwards.
     * @param args Arguments for the command.
     */
    async function executeAndExpect(command: string, expected: boolean, ...args: any[]) {
        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand(command, ...args);

        await waitForChangedEvent(expected, command);
        await waitForNoiseSuppression(expected, `Noise suppression was not ${expected ? 'enabled' : 'disabled'} by ${
            command}`);
    }

    it('joining the meeting', async () => {
        // A local audio track is needed, otherwise only the redux flag is updated and no effect is applied.
        await ensureOneParticipant({
            configOverwrite: {
                // The tests disable audio processing by default, with it disabled Chrome's fake microphone is stereo,
                // regardless of the requested channelCount, and noise suppression can't be enabled on stereo tracks.
                disableAP: false,
                startSilent: false,
                startWithAudioMuted: false
            }
        }, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToIFrame();
        await p1.driver.waitUntil(
            () => p1.execute(() => APP.store.getState()['features/base/tracks']
                .some((t: any) => t.local && t.mediaType === 'audio' && t.jitsiTrack)),
            {
                timeout: 10_000,
                timeoutMsg: 'No local audio track was created'
            });

        // Noise suppression is only supported on mono tracks, see canEnableNoiseSuppression.
        expect(await p1.execute(() => APP.store.getState()['features/base/tracks']
            .find((t: any) => t.local && t.mediaType === 'audio')?.jitsiTrack.getTrack().getSettings().channelCount))
            .toBe(1);

        await p1.switchToMainFrame();
        await p1.getIframeAPI().addEventListener('noiseSuppressionChanged');
    });

    it('enables noise suppression via setNoiseSuppressionEnabled command', async () => {
        await setInitialState(false);
        await executeAndExpect('setNoiseSuppressionEnabled', true, { enabled: true });
    });

    it('disables noise suppression via setNoiseSuppressionEnabled command', async () => {
        await setInitialState(true);
        await executeAndExpect('setNoiseSuppressionEnabled', false, { enabled: false });
    });

    it('enables noise suppression via toggleNoiseSuppression command', async () => {
        await setInitialState(false);
        await executeAndExpect('toggleNoiseSuppression', true);
    });

    it('disables noise suppression via toggleNoiseSuppression command', async () => {
        await setInitialState(true);
        await executeAndExpect('toggleNoiseSuppression', false);
    });

    it('applies back-to-back toggleNoiseSuppression commands in order', async () => {
        await setInitialState(false);

        // Both commands are sent before the first one has finished applying the effect, they should still result in
        // on -> off and not in noise suppression being enabled twice.
        await p1.switchToMainFrame();
        await p1.execute(() => {
            const { jitsiAPI } = window as any;

            jitsiAPI.executeCommand('toggleNoiseSuppression');
            jitsiAPI.executeCommand('toggleNoiseSuppression');
        });

        await waitForChangedEvent(false, 'two toggleNoiseSuppression commands');
        await waitForNoiseSuppression(false, 'Noise suppression was not disabled by the second toggle');

        expect(await getNoiseSuppressionState()).toEqual({
            effectOnTrack: false,
            enabled: false
        });
    });
});
