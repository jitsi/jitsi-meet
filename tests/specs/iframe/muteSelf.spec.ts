import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { joinMuc } from '../../helpers/joinMuc';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Participant mute iframe API commands', () => {
    let p1: Participant;
    let p2: Participant;

    /**
     * Executes a media toggle command, waits for its event, and verifies that the corresponding
     * getter reflects the expected mute state. Also verifies the toolbar button state inside
     * the meeting iframe to confirm the actual track state changed.
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

        await p1.switchToIFrame();

        const toolbar = p1.getToolbar();

        if (event === 'audioMuteStatusChanged') {
            const audioMuted = await toolbar.getAudioButton().getAttribute('aria-label');

            expect(audioMuted).toBe(expectedMuted ? 'Unmute' : 'Mute');
        } else {
            const videoMuted = await toolbar.getVideoButton().getAttribute('aria-label');

            expect(videoMuted).toBe(expectedMuted ? 'Start camera' : 'Stop camera');
        }

        await p1.switchToMainFrame();
    }

    it('joining the meeting', async () => {
        p1 = await joinMuc({ name: 'p1', iFrameApi: true, token: testsConfig.jwt.preconfiguredToken });

        if (!await checkIframeApi(p1)) {
            return;
        }

        p2 = await joinMuc({ name: 'p2', iFrameApi: true });

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();

        await p1.getIframeAPI().addEventListener('audioMuteStatusChanged');
        await p1.getIframeAPI().addEventListener('videoMuteStatusChanged');
        await p2.getIframeAPI().addEventListener('audioMuteStatusChanged');
        await p2.getIframeAPI().addEventListener('videoMuteStatusChanged');
    });

    it('mutes local audio via muteRemoteParticipant on self', async () => {
        const iframeAPI = p1.getIframeAPI();
        const p1EndpointId = await p1.getEndpointId();

        await iframeAPI.clearEventResults('audioMuteStatusChanged');
        await iframeAPI.executeCommand('muteRemoteParticipant', p1EndpointId, 'audio');

        const mutedEvent = await iframeAPI.waitForEventResult<{ muted: boolean; }>(
            'audioMuteStatusChanged',
            'audioMuteStatusChanged event was not received after muteRemoteParticipant'
        );

        expect(mutedEvent.muted).toBe(true);

        await p1.driver.waitUntil(
            async () => await iframeAPI.isAudioMuted(),
            {
                timeout: 5000,
                timeoutMsg: 'isAudioMuted() is false after muteRemoteParticipant'
            }
        );
    });

    it('mutes local video via muteRemoteParticipant on self', async () => {
        const iframeAPI = p1.getIframeAPI();
        const p1EndpointId = await p1.getEndpointId();

        await iframeAPI.clearEventResults('videoMuteStatusChanged');
        await iframeAPI.executeCommand('muteRemoteParticipant', p1EndpointId, 'video');

        const mutedEvent = await iframeAPI.waitForEventResult<{ muted: boolean; }>(
            'videoMuteStatusChanged',
            'videoMuteStatusChanged event was not received after muteRemoteParticipant'
        );

        expect(mutedEvent.muted).toBe(true);

        await p1.driver.waitUntil(
            async () => await iframeAPI.isVideoMuted(),
            {
                timeout: 5000,
                timeoutMsg: 'isVideoMuted() is false after muteRemoteParticipant'
            }
        );
    });

    it('mutes remote participant audio via muteEveryone command', async () => {
        const p1Api = p1.getIframeAPI();
        const p2Api = p2.getIframeAPI();

        // Ensure p2 has audio unmuted initially if needed
        if (await p2Api.isAudioMuted()) {
            await p2.switchToIFrame();
            await p2.getToolbar().clickAudioUnmuteButton();
            await p2.switchToMainFrame();
            await p2.driver.waitUntil(
                async () => !await p2Api.isAudioMuted(),
                {
                    timeout: 5000,
                    timeoutMsg: 'Failed to ensure p2 audio is unmuted'
                }
            );
        }

        await p2Api.clearEventResults('audioMuteStatusChanged');
        await p1Api.executeCommand('muteEveryone', 'audio');

        const p2AudioMutedEvent = await p2Api.waitForEventResult<{ muted: boolean; }>(
            'audioMuteStatusChanged',
            'audioMuteStatusChanged was not received on p2 after muteEveryone'
        );

        expect(p2AudioMutedEvent.muted).toBe(true);

        await p2.driver.waitUntil(
            async () => await p2Api.isAudioMuted(),
            {
                timeout: 5000,
                timeoutMsg: 'isAudioMuted() is false on p2 after muteEveryone'
            }
        );

        // Repeating muteEveryone must not unmute p2
        await p2Api.clearEventResults('audioMuteStatusChanged');
        await p1Api.executeCommand('muteEveryone', 'audio');
        await p2.driver.pause(1000);

        const repeatedEvent = await p2Api.getEventResult('audioMuteStatusChanged');

        expect(repeatedEvent ? repeatedEvent.muted : true).toBe(true);
        expect(await p2Api.isAudioMuted()).toBe(true);
    });

    it('mutes remote participant video via muteEveryone command', async () => {
        const p1Api = p1.getIframeAPI();
        const p2Api = p2.getIframeAPI();

        // Ensure p2 has video unmuted initially if needed
        if (await p2Api.isVideoMuted()) {
            await p2.switchToIFrame();
            await p2.getToolbar().clickVideoUnmuteButton();
            await p2.switchToMainFrame();
            await p2.driver.waitUntil(
                async () => !await p2Api.isVideoMuted(),
                {
                    timeout: 5000,
                    timeoutMsg: 'Failed to ensure p2 video is unmuted'
                }
            );
        }

        await p2Api.clearEventResults('videoMuteStatusChanged');
        await p1Api.executeCommand('muteEveryone', 'video');

        const p2VideoMutedEvent = await p2Api.waitForEventResult<{ muted: boolean; }>(
            'videoMuteStatusChanged',
            'videoMuteStatusChanged was not received on p2 after muteEveryone(video)'
        );

        expect(p2VideoMutedEvent.muted).toBe(true);

        await p2.driver.waitUntil(
            async () => await p2Api.isVideoMuted(),
            {
                timeout: 5000,
                timeoutMsg: 'isVideoMuted() is false on p2 after muteEveryone(video)'
            }
        );
    });

    it('toggles audio mute status via toggleAudio command', async () => {
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
