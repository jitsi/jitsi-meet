import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

/**
 * A known YouTube video ID for shared video e2e testing.
 */
const VIDEO_ID = 'xvFZjo5PgG0';
const YOUTUBE_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

describe('Shared video iframe API commands', () => {
    let p1: Participant;
    let p2: Participant;

    /**
     * Reads whether a fake participant for shared video is registered in Redux participants state.
     *
     * @param observer The participant whose store to check.
     */
    async function hasSharedVideoParticipant(observer: Participant): Promise<boolean> {
        return await observer.execute(
            () => {
                const { remote } = APP.store.getState()['features/base/participants'];

                return Array.from(remote.values()).some((p: any) => p.fakeParticipant === 'SharedVideo');
            }
        );
    }

    /**
     * Reads current shared video status from features/shared-video in the store.
     *
     * @param observer The participant whose store to check.
     */
    async function getSharedVideoStatus(observer: Participant): Promise<string> {
        return await observer.execute(
            () => APP.store.getState()['features/shared-video']?.status ?? ''
        );
    }

    it('joining the meeting', async () => {
        await ensureTwoParticipants({}, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;
        p2 = ctx.p2;

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();
    });

    it('starts video sharing via startShareVideo command', async () => {
        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand('startShareVideo', YOUTUBE_URL);

        // Verify shared video status on p1
        await p1.switchToIFrame();
        await p1.driver.waitUntil(
            async () => await getSharedVideoStatus(p1) === 'start',
            {
                timeout: 10_000,
                timeoutMsg: 'Shared video status was not updated to start on p1'
            }
        );

        // Verify remote participant (p2) detects the shared video
        await p2.switchToIFrame();
        await p2.driver.waitUntil(
            async () => await hasSharedVideoParticipant(p2),
            {
                timeout: 10_000,
                timeoutMsg: 'Remote participant p2 did not receive the shared video participant'
            }
        );
    });

    it('stops video sharing via stopShareVideo command', async () => {
        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand('stopShareVideo');

        // Verify shared video status resets on p1
        await p1.switchToIFrame();
        await p1.driver.waitUntil(
            async () => await getSharedVideoStatus(p1) === 'stop' || await getSharedVideoStatus(p1) === '',
            {
                timeout: 10_000,
                timeoutMsg: 'Shared video status was not stopped on p1'
            }
        );

        // Verify shared video fake participant is removed on p2
        await p2.switchToIFrame();
        await p2.driver.waitUntil(
            async () => !await hasSharedVideoParticipant(p2),
            {
                timeout: 10_000,
                timeoutMsg: 'Shared video participant was not removed on p2 after stopShareVideo'
            }
        );
    });

    it('rejects startShareVideo with invalid video URL without altering state', async () => {
        await p1.switchToMainFrame();
        await p1.getIframeAPI().executeCommand('startShareVideo', 'https://invalid-non-video-domain.example.com/not-a-video');

        await p1.switchToIFrame();
        await p1.driver.pause(2000);

        // Status should remain stopped or empty
        const status = await getSharedVideoStatus(p1);

        expect(status).not.toBe('start');
        expect(await hasSharedVideoParticipant(p1)).toBe(false);
    });
});
