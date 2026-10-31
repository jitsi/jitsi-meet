import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Pin participant iframe API command', () => {
    let p1: Participant;
    let p2: Participant;

    /**
     * Gets the currently pinned participant ID from redux store inside the meeting iframe,
     * and ensures the browsing context is restored to the main frame.
     */
    async function getPinnedParticipantId(): Promise<string | undefined> {
        await p1.switchToIFrame();
        try {
            return await p1.execute(() => {
                const state = APP.store.getState();
                const { pinnedParticipant } = state['features/base/participants'] || {};

                return pinnedParticipant;
            });
        } finally {
            await p1.switchToMainFrame();
        }
    }

    /**
     * Checks whether the pin indicator element for the given endpoint ID is displayed
     * in the meeting iframe, and ensures the browsing context is restored to the main frame.
     *
     * @param {string} epId - The participant endpoint ID.
     * @returns {Promise<boolean>}
     */
    async function isPinIndicatorDisplayed(epId: string): Promise<boolean> {
        await p1.switchToIFrame();
        try {
            const indicator = await p1.driver.$(`//div[@id="pin-indicator-${epId}"]`);

            return await indicator.isDisplayed();
        } catch {
            return false;
        } finally {
            await p1.switchToMainFrame();
        }
    }

    it('joining the meeting', async () => {
        await ensureTwoParticipants({}, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;
        p2 = ctx.p2;

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
    });

    afterEach(async () => {
        if (!p1) {
            return;
        }

        // Clean up: unpin any pinned participant to leave clean state for next test.
        const pinnedId = await getPinnedParticipantId();

        if (pinnedId) {
            await p1.switchToMainFrame();
            await p1.getIframeAPI().pinParticipant();
            await p1.driver.waitUntil(
                async () => !await getPinnedParticipantId(),
                {
                    timeout: 5000,
                    timeoutMsg: 'Failed to reset pinned participant after test'
                }
            );
        }
    });

    it('pins remote participant via pinParticipant(id)', async () => {
        const p2EndpointId = await p2.getEndpointId();
        const iframeAPI = p1.getIframeAPI();

        await p1.switchToMainFrame();
        await iframeAPI.pinParticipant(p2EndpointId);

        await p1.driver.waitUntil(
            async () => await getPinnedParticipantId() === p2EndpointId,
            {
                timeout: 5000,
                timeoutMsg: `Expected participant ${p2EndpointId} to be pinned in redux`
            }
        );

        await p1.driver.waitUntil(
            async () => await isPinIndicatorDisplayed(p2EndpointId),
            {
                timeout: 5000,
                timeoutMsg: `Pin indicator for ${p2EndpointId} was not displayed`
            }
        );
    });

    it('unpins participant when pinParticipant is called without arguments', async () => {
        const p2EndpointId = await p2.getEndpointId();
        const iframeAPI = p1.getIframeAPI();

        // First pin p2
        await p1.switchToMainFrame();
        await iframeAPI.pinParticipant(p2EndpointId);
        await p1.driver.waitUntil(
            async () => await getPinnedParticipantId() === p2EndpointId,
            {
                timeout: 5000,
                timeoutMsg: `Participant ${p2EndpointId} was not pinned`
            }
        );

        // Now unpin with no arguments
        await iframeAPI.pinParticipant();

        await p1.driver.waitUntil(
            async () => !await getPinnedParticipantId(),
            {
                timeout: 5000,
                timeoutMsg: 'Expected pinned participant to be cleared in redux'
            }
        );

        await p1.driver.waitUntil(
            async () => !await isPinIndicatorDisplayed(p2EndpointId),
            {
                timeout: 5000,
                timeoutMsg: `Pin indicator for ${p2EndpointId} should not be displayed after unpin`
            }
        );
    });

    it('pins local participant via pinParticipant(localId)', async () => {
        const p1EndpointId = await p1.getEndpointId();
        const iframeAPI = p1.getIframeAPI();

        await p1.switchToMainFrame();
        await iframeAPI.pinParticipant(p1EndpointId);

        await p1.driver.waitUntil(
            async () => await getPinnedParticipantId() === p1EndpointId,
            {
                timeout: 5000,
                timeoutMsg: `Expected local participant ${p1EndpointId} to be pinned in redux`
            }
        );

        await p1.driver.waitUntil(
            async () => await isPinIndicatorDisplayed(p1EndpointId),
            {
                timeout: 5000,
                timeoutMsg: `Pin indicator for local participant ${p1EndpointId} was not displayed`
            }
        );
    });

    it('gracefully handles non-existing participant id without breaking state', async () => {
        const iframeAPI = p1.getIframeAPI();

        const beforePinnedId = await getPinnedParticipantId();

        await p1.switchToMainFrame();
        await iframeAPI.pinParticipant('non-existing-participant-id-99999');

        // Allow any asynchronous dispatch cycle to complete
        await p1.driver.pause(500);

        const afterPinnedId = await getPinnedParticipantId();

        expect(afterPinnedId).toBe(beforePinnedId);
    });
});
