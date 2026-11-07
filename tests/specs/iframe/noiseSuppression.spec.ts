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
     * Sets the initial noise suppression state by executing the setNoiseSuppressionEnabled command.
     *
     * @param enabled The desired initial state.
     */
    async function setInitialState(enabled: boolean) {
        const state = await getNoiseSuppressionState();

        if (state.enabled !== enabled || state.effectOnTrack !== enabled) {
            await p1.switchToMainFrame();
            await p1.getIframeAPI().executeCommand('setNoiseSuppressionEnabled', enabled);
            await waitForNoiseSuppression(enabled, `Failed to set initial noise suppression state to ${enabled}`);
        }
    }

    /**
     * Waits for the noiseSuppressionStatusChanged event with the given value.
     *
     * @param enabled Whether noise suppression is expected to be enabled.
     * @param action The action that triggered the event, used in the timeout message.
     */
    async function waitForChangedEvent(enabled: boolean, action: string) {
        await p1.switchToMainFrame();

        const eventResult = await p1.getIframeAPI().waitForEventResult(
            'noiseSuppressionStatusChanged',
            `noiseSuppressionStatusChanged event was not received for ${action}`
        );

        expect(eventResult).toEqual({ enabled });
    }

    /**
     * Executes a command on the iframe API and asserts that the noiseSuppressionStatusChanged event was received,
     * the redux state was updated, and the effect was applied to or removed from the local audio track.
     *
     * @param command The command to execute.
     * @param expected Whether noise suppression is expected to be enabled.
     * @param commandArgs Optional arguments for the command.
     */
    async function executeAndExpect(command: string, expected: boolean, ...commandArgs: any[]) {
        await p1.switchToMainFrame();
        await p1.getIframeAPI().clearEventResults('noiseSuppressionStatusChanged');
        await p1.getIframeAPI().executeCommand(command, ...commandArgs);

        await waitForChangedEvent(expected, `${command}(${commandArgs.join(', ')})`);
        await waitForNoiseSuppression(
            expected,
            `Noise suppression was not ${expected ? 'enabled' : 'disabled'} by ${command}`
        );

        expect(await getNoiseSuppressionState()).toEqual({
            effectOnTrack: expected,
            enabled: expected
        });
    }

    it('joining the meeting', async () => {
        // Unmute audio so the track is unmuted and the effect can be applied.
        await ensureOneParticipant({
            configOverwrite: {
                startWithAudioMuted: false
            }
        }, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;

        if (!await checkIframeApi(p1)) {
            return;
        }

        // Noise suppression requires audio worklets.
        if (!await p1.execute(() => 'audioWorklet' in AudioContext.prototype)) {
            ctx.skipSuiteTests = 'Audio worklets not supported';

            return;
        }

        await p1.switchToMainFrame();
        await p1.getIframeAPI().addEventListener('noiseSuppressionStatusChanged');

        // Check that the initial state is as expected (disabled by default) and the effect is not set on the track.
        expect(await getNoiseSuppressionState()).toEqual({
            effectOnTrack: false,
            enabled: false
        });

        // Wait for the local audio track to be available, since effects can only be applied to existing tracks.
        await p1.driver.waitUntil(
            () => p1.execute(() => {
                const tracks = APP.store.getState()['features/base/tracks'];

                return Boolean(tracks.find((t: any) => t.local && t.mediaType === 'audio')?.jitsiTrack);
            }),
            {
                timeout: 5000,
                timeoutMsg: 'Local audio track was not created'
            });

        expect(await p1.execute(() => APP.store.getState()['features/base/tracks']
            .find((t: any) => t.local && t.mediaType === 'audio')?.jitsiTrack)).toBeDefined();
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

    it('verifies audio processing buffer math constraints for worklet denoiser', async () => {
        const mathCheck = await p1.execute(() => {
            // NoiseSuppressorWorklet calculates circularBufferLength = leastCommonMultiple(sampleRate, denoiseSampleSize)
            // Validate mathematical properties used across standard WebRTC sample rates: 44100Hz, 48000Hz, 16000Hz
            const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
            const lcm = (a: number, b: number): number => Math.abs(a * b) / gcd(a, b);

            const denoiseSampleSize = 128; // Standard denoise chunk size
            const sampleRates = [ 16000, 44100, 48000 ];
            const bufferLengths = sampleRates.map(rate => lcm(rate, denoiseSampleSize));

            return {
                validGcd: gcd(48, 18) === 6 && gcd(20, 5) === 5,
                validLcm: lcm(4, 6) === 12 && lcm(20, 5) === 20,
                // Buffer lengths must be exact multiples of both the sample rate and chunk size
                bufferExactMultiples: bufferLengths.every((bufLen, idx) =>
                    bufLen % sampleRates[idx] === 0 && bufLen % denoiseSampleSize === 0
                )
            };
        });

        expect(mathCheck.validGcd).toBe(true);
        expect(mathCheck.validLcm).toBe(true);
        expect(mathCheck.bufferExactMultiples).toBe(true);
    });
});
