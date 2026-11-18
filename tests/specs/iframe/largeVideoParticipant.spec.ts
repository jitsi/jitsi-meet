import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Large video participant iframe API command', () => {
    let p1: Participant;
    let p2: Participant;

    /**
     * Reads the current large video participant ID from the redux store inside the meeting iframe,
     * and ensures the browsing context is restored to the main frame.
     */
    async function getLargeVideoParticipantId(): Promise<string | undefined> {
        await p1.switchToIFrame();
        try {
            return await p1.execute(() => APP.store.getState()['features/large-video']?.participantId);
        } finally {
            await p1.switchToMainFrame();
        }
    }

    /**
     * Checks whether tile view is currently active in the redux store inside the meeting iframe,
     * and ensures the browsing context is restored to the main frame.
     */
    async function isTileViewActive(): Promise<boolean> {
        await p1.switchToIFrame();
        try {
            return await p1.execute(() => Boolean(APP.store.getState()['features/video-layout']?.tileViewEnabled));
        } finally {
            await p1.switchToMainFrame();
        }
    }

    it('joining the meeting', async () => {
        await ensureTwoParticipants({
            configOverwrite: {
                p2p: { enabled: false },
                startWithAudioMuted: true
            }
        }, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;
        p2 = ctx.p2;

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
    });

    it('selects participant on large video via setLargeVideoParticipant', async () => {
        const p1EndpointId = await p1.getEndpointId();
        const iframeAPI = p1.getIframeAPI();

        // Initially p2 is on large video in a 2-party call.
        // Selecting p1's own endpoint id verifies that the command took effect.
        await p1.switchToMainFrame();
        await iframeAPI.executeCommand('setLargeVideoParticipant', p1EndpointId);

        await p1.driver.waitUntil(
            async () => await getLargeVideoParticipantId() === p1EndpointId,
            {
                timeout: 5000,
                timeoutMsg: `Expected large video participant to be ${p1EndpointId}`
            }
        );

        await p1.switchToIFrame();
        await p1.waitForParticipantOnLargeVideo(p1EndpointId);
        await p1.switchToMainFrame();
    });

    it('automatically exits tile view when selecting a large video participant', async () => {
        const p2EndpointId = await p2.getEndpointId();
        const iframeAPI = p1.getIframeAPI();

        // 1. First enter tile view
        await p1.switchToMainFrame();
        await iframeAPI.executeCommand('setTileView', true);
        await p1.driver.waitUntil(
            async () => await isTileViewActive(),
            {
                timeout: 5000,
                timeoutMsg: 'Failed to enter tile view'
            }
        );

        // 2. Selecting a large video participant should auto-exit tile view
        await iframeAPI.executeCommand('setLargeVideoParticipant', p2EndpointId);

        await p1.driver.waitUntil(
            async () => !await isTileViewActive(),
            {
                timeout: 5000,
                timeoutMsg: 'Expected tile view to be automatically disabled'
            }
        );

        await p1.driver.waitUntil(
            async () => await getLargeVideoParticipantId() === p2EndpointId,
            {
                timeout: 5000,
                timeoutMsg: `Expected large video participant to be ${p2EndpointId}`
            }
        );
    });

    it('unselects large video participant when called without arguments', async () => {
        const p1EndpointId = await p1.getEndpointId();
        const p2EndpointId = await p2.getEndpointId();
        const iframeAPI = p1.getIframeAPI();

        // Select p1 first
        await p1.switchToMainFrame();
        await iframeAPI.executeCommand('setLargeVideoParticipant', p1EndpointId);
        await p1.driver.waitUntil(
            async () => await getLargeVideoParticipantId() === p1EndpointId,
            {
                timeout: 5000,
                timeoutMsg: `Participant ${p1EndpointId} was not selected`
            }
        );

        // Unselect without arguments: should re-elect default remote participant p2
        await iframeAPI.executeCommand('setLargeVideoParticipant');

        await p1.driver.waitUntil(
            async () => await getLargeVideoParticipantId() === p2EndpointId,
            {
                timeout: 5000,
                timeoutMsg: `Expected large video to return to ${p2EndpointId}`
            }
        );
    });

    it('gracefully handles non-existing participant id without altering state', async () => {
        const p1EndpointId = await p1.getEndpointId();
        const iframeAPI = p1.getIframeAPI();

        // Select p1 first so large video is not the default p2
        await p1.switchToMainFrame();
        await iframeAPI.executeCommand('setLargeVideoParticipant', p1EndpointId);
        await p1.driver.waitUntil(
            async () => await getLargeVideoParticipantId() === p1EndpointId,
            {
                timeout: 5000,
                timeoutMsg: `Expected large video participant to be ${p1EndpointId}`
            }
        );

        // Attempting to select a non-existing participant id should do nothing
        await iframeAPI.executeCommand('setLargeVideoParticipant', 'invalid-non-existing-id-999');

        // Allow any potential asynchronous action to settle
        await p1.driver.pause(500);

        const currentParticipantId = await getLargeVideoParticipantId();

        expect(currentParticipantId).toBe(p1EndpointId);
    });
});
