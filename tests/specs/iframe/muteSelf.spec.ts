import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { joinMuc } from '../../helpers/joinMuc';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

describe('Local participant mute iframe API commands', () => {
    let p1: Participant;

    /**
     * Executes a media toggle command, waits for its event, and verifies that the corresponding
     * getter reflects the expected mute state.
     *
     * @param command The iframe API toggle command name ('toggleAudio' | 'toggleVideo').
     * @param event The iframe API event name ('audioMuteStatusChanged' | 'videoMuteStatusChanged').
     * @param getter The iframe API getter function returning whether media is muted.
     * @param expectedMuted Whether the media is expected to be muted.
     */
    async function toggleAndExpect(
            command: 'toggleAudio' | 'toggleVideo',
            event: 'audioMuteStatusChanged' | 'videoMuteStatusChanged',
            getter: () => Promise<boolean>,
            expectedMuted: boolean
    ) {
        const iframeAPI = p1.getIframeAPI();

        await iframeAPI.clearEventResults(event);
        await iframeAPI.executeCommand(command);

        const statusEvent = await iframeAPI.waitForEventResult<{ muted: boolean; }>(
            event,
            `${event} event was not received for ${command} (${expectedMuted ? 'mute' : 'unmute'})`
        );

        expect(statusEvent.muted).toBe(expectedMuted);

        await p1.driver.waitUntil(
            async () => (await getter()) === expectedMuted,
            {
                timeout: 5000,
                timeoutMsg: `${command} getter did not reflect muted state ${expectedMuted}`
            }
        );
    }

    it('setup', async () => {
        p1 = await joinMuc({ name: 'p1', iFrameApi: true, token: testsConfig.jwt.preconfiguredToken });

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();

        await p1.getIframeAPI().addEventListener('audioMuteStatusChanged');
        await p1.getIframeAPI().addEventListener('videoMuteStatusChanged');
    });

    it('mutes local audio and keeps it muted when repeated', async () => {
        const iframeAPI = p1.getIframeAPI();
        const p1EndpointId = await p1.getEndpointId();

        await iframeAPI.clearEventResults('audioMuteStatusChanged');
        await iframeAPI.executeCommand('muteRemoteParticipant', p1EndpointId, 'audio');

        const mutedEvent = await iframeAPI.waitForEventResult<{ muted: boolean; }>(
            'audioMuteStatusChanged',
            'audioMuteStatusChanged event was not received after muteRemoteParticipant'
        );

        expect(mutedEvent.muted).toBe(true);

        // Muting an already muted local participant must not unmute them.
        await iframeAPI.clearEventResults('audioMuteStatusChanged');
        await iframeAPI.executeCommand('muteRemoteParticipant', p1EndpointId, 'audio');
        await p1.driver.pause(1000);

        const secondEvent = await iframeAPI.getEventResult('audioMuteStatusChanged');

        expect(secondEvent ? secondEvent.muted : true).toBe(true);

        await p1.driver.waitUntil(
            async () => await iframeAPI.isAudioMuted(),
            {
                timeout: 5000,
                timeoutMsg: 'isAudioMuted() is false after muteRemoteParticipant'
            }
        );
    });

    it('mutes local video and keeps it muted when repeated', async () => {
        const iframeAPI = p1.getIframeAPI();
        const p1EndpointId = await p1.getEndpointId();

        await iframeAPI.clearEventResults('videoMuteStatusChanged');
        await iframeAPI.executeCommand('muteRemoteParticipant', p1EndpointId, 'video');

        const mutedEvent = await iframeAPI.waitForEventResult<{ muted: boolean; }>(
            'videoMuteStatusChanged',
            'videoMuteStatusChanged event was not received after muteRemoteParticipant'
        );

        expect(mutedEvent.muted).toBe(true);

        // Muting an already muted local participant must not unmute them.
        await iframeAPI.clearEventResults('videoMuteStatusChanged');
        await iframeAPI.executeCommand('muteRemoteParticipant', p1EndpointId, 'video');
        await p1.driver.pause(1000);

        const secondEvent = await iframeAPI.getEventResult('videoMuteStatusChanged');

        expect(secondEvent ? secondEvent.muted : true).toBe(true);

        await p1.driver.waitUntil(
            async () => await iframeAPI.isVideoMuted(),
            {
                timeout: 5000,
                timeoutMsg: 'isVideoMuted() is false after muteRemoteParticipant'
            }
        );
    });

    it('toggles audio mute status via toggleAudio command', async () => {
        if (!await checkIframeApi(p1)) {
            return;
        }

        const iframeAPI = p1.getIframeAPI();

        // Ensure audio is muted initially so the test is self-contained.
        if (!await iframeAPI.isAudioMuted()) {
            await iframeAPI.executeCommand('muteRemoteParticipant', await p1.getEndpointId(), 'audio');
            await p1.driver.waitUntil(
                async () => await iframeAPI.isAudioMuted(),
                {
                    timeout: 5000,
                    timeoutMsg: 'Initial audio mute setup failed'
                }
            );
        }

        // Toggle to unmute.
        await toggleAndExpect('toggleAudio', 'audioMuteStatusChanged', () => iframeAPI.isAudioMuted(), false);

        // Toggle to mute again.
        await toggleAndExpect('toggleAudio', 'audioMuteStatusChanged', () => iframeAPI.isAudioMuted(), true);
    });

    it('toggles video mute status via toggleVideo command', async () => {
        if (!await checkIframeApi(p1)) {
            return;
        }

        const iframeAPI = p1.getIframeAPI();

        // Ensure video is muted initially so the test is self-contained.
        if (!await iframeAPI.isVideoMuted()) {
            await iframeAPI.executeCommand('muteRemoteParticipant', await p1.getEndpointId(), 'video');
            await p1.driver.waitUntil(
                async () => await iframeAPI.isVideoMuted(),
                {
                    timeout: 5000,
                    timeoutMsg: 'Initial video mute setup failed'
                }
            );
        }

        // Toggle to unmute.
        await toggleAndExpect('toggleVideo', 'videoMuteStatusChanged', () => iframeAPI.isVideoMuted(), false);

        // Toggle to mute again.
        await toggleAndExpect('toggleVideo', 'videoMuteStatusChanged', () => iframeAPI.isVideoMuted(), true);
    });
});
