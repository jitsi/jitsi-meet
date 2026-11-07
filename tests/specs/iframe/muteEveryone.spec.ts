import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Mute everyone iframe API command', () => {
    let p1: Participant;
    let p2: Participant;

    it('joining the meeting', async () => {
        await ensureTwoParticipants({
            configOverwrite: {
                startWithAudioMuted: false,
                startWithVideoMuted: false
            }
        }, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;
        p2 = ctx.p2;

        if (!await checkIframeApi(p1)) {
            return;
        }

        if (!await p1.isModerator() || await p2.isModerator()) {
            ctx.skipSuiteTests = 'This test needs p1 to be the only moderator.';

            return;
        }

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();

        await p1.getIframeAPI().addEventListener('audioMuteStatusChanged');
        await p2.getIframeAPI().addEventListener('audioMuteStatusChanged');
        await p1.getIframeAPI().addEventListener('videoMuteStatusChanged');
        await p2.getIframeAPI().addEventListener('videoMuteStatusChanged');
    });

    it('mutes everyone audio via muteEveryone command while keeping moderator unmuted', async () => {
        // Ensure both participants have audio unmuted initially
        await p1.switchToIFrame();
        await p1.getToolbar().unmuteAudio();
        await p2.switchToIFrame();
        await p2.getToolbar().unmuteAudio();

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();

        await p2.getIframeAPI().clearEventResults('audioMuteStatusChanged');
        await p1.getIframeAPI().clearEventResults('audioMuteStatusChanged');

        // Moderator executes muteEveryone
        await p1.getIframeAPI().executeCommand('muteEveryone');

        // Remote participant (p2) must receive audioMuteStatusChanged { muted: true }
        const p2MutedEvent = await p2.getIframeAPI().waitForEventResult<{ muted: boolean; }>(
            'audioMuteStatusChanged',
            'audioMuteStatusChanged event was not received by p2 after muteEveryone'
        );

        expect(p2MutedEvent.muted).toBe(true);

        await p2.switchToIFrame();
        await p2.getToolbar().waitForAudioMuted();

        // Moderator (p1) must remain unmuted (excluded from muteEveryone)
        await p1.switchToMainFrame();
        expect(await p1.getIframeAPI().isAudioMuted()).toBe(false);
        await p1.switchToIFrame();
        await p1.getToolbar().waitForAudioNotMuted();
    });

    it('repeating muteEveryone audio does not unmute previously muted participants', async () => {
        await p1.switchToMainFrame();
        await p2.switchToMainFrame();

        await p2.getIframeAPI().clearEventResults('audioMuteStatusChanged');
        await p1.getIframeAPI().executeCommand('muteEveryone', 'audio');

        await p2.driver.pause(1000);

        await p2.switchToIFrame();
        await p2.getToolbar().waitForAudioMuted();
        await p1.switchToIFrame();
        await p1.getToolbar().waitForAudioNotMuted();
    });

    it('mutes everyone video via muteEveryone command while keeping moderator unmuted', async () => {
        // Ensure both participants have video unmuted initially
        await p1.switchToIFrame();
        await p1.getToolbar().unmuteVideo();
        await p2.switchToIFrame();
        await p2.getToolbar().unmuteVideo();

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();

        await p2.getIframeAPI().clearEventResults('videoMuteStatusChanged');
        await p1.getIframeAPI().clearEventResults('videoMuteStatusChanged');

        // Moderator executes muteEveryone for video
        await p1.getIframeAPI().executeCommand('muteEveryone', 'video');

        const p2VideoMutedEvent = await p2.getIframeAPI().waitForEventResult<{ muted: boolean; }>(
            'videoMuteStatusChanged',
            'videoMuteStatusChanged event was not received by p2 after muteEveryone(video)'
        );

        expect(p2VideoMutedEvent.muted).toBe(true);

        await p2.switchToIFrame();
        await p2.getToolbar().waitForVideoMuted();

        // Moderator (p1) must remain unmuted
        await p1.switchToMainFrame();
        expect(await p1.getIframeAPI().isVideoMuted()).toBe(false);
        await p1.switchToIFrame();
        await p1.getToolbar().waitForVideoNotMuted();
    });

    it('ignores muteEveryone commands executed by a non-moderator participant', async () => {
        // Moderator unmutes p2 audio and video for testing non-moderator boundary
        await p2.switchToIFrame();
        await p2.getToolbar().unmuteAudio();

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();

        await p1.getIframeAPI().clearEventResults('audioMuteStatusChanged');

        // Non-moderator (p2) attempts to execute muteEveryone
        await p2.getIframeAPI().executeCommand('muteEveryone');
        await p1.driver.pause(1000);

        // Moderator (p1) audio must remain unaffected
        await p1.switchToIFrame();
        await p1.getToolbar().waitForAudioNotMuted();
    });
});
