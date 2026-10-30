import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

describe('Camera mirror iframe API command', () => {
    let p1: Participant;
    let initialFlipX: boolean;

    /**
     * Reads the current localFlipX setting from redux store inside the meeting iframe
     * and switches back to the main frame for iframe API interaction.
     */
    async function getLocalFlipX(): Promise<boolean> {
        await p1.switchToIFrame();
        const flipX = await p1.execute(() => Boolean(APP.store.getState()['features/base/settings']?.localFlipX));

        await p1.switchToMainFrame();

        return flipX;
    }

    /**
     * Checks whether the local thumbnail video element has the flipVideoX CSS class
     * inside the meeting iframe and switches back to the main frame.
     */
    async function isLocalVideoFlipped(): Promise<boolean> {
        await p1.switchToIFrame();
        const videoElement = await p1.driver.$('#localVideo_container');
        const isFlipped = await videoElement.isExisting()
            && (await videoElement.getAttribute('class')).includes('flipVideoX');

        await p1.switchToMainFrame();

        return isFlipped;
    }

    it('joining the meeting', async () => {
        await ensureOneParticipant({}, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;

        if (!await checkIframeApi(p1)) {
            return;
        }

        initialFlipX = await getLocalFlipX();
    });

    afterEach(async () => {
        if (!p1) {
            return;
        }

        const currentFlipX = await getLocalFlipX();

        if (currentFlipX !== initialFlipX) {
            await p1.getIframeAPI().executeCommand('toggleCameraMirror');
            await p1.driver.waitUntil(
                async () => await getLocalFlipX() === initialFlipX,
                {
                    timeout: 5000,
                    timeoutMsg: 'Failed to restore initial localFlipX setting'
                }
            );
        }
    });

    it('toggles camera mirror via toggleCameraMirror command', async () => {
        const iframeAPI = p1.getIframeAPI();

        // 1. Toggle camera mirror off (relative to initial state).
        await p1.switchToMainFrame();
        await iframeAPI.executeCommand('toggleCameraMirror');

        await p1.driver.waitUntil(
            async () => await getLocalFlipX() === !initialFlipX,
            {
                timeout: 5000,
                timeoutMsg: 'localFlipX was not toggled'
            }
        );

        await p1.driver.waitUntil(
            async () => await isLocalVideoFlipped() === !initialFlipX,
            {
                timeout: 5000,
                timeoutMsg: 'local video flipVideoX class was not toggled'
            }
        );

        // 2. Toggle camera mirror back on (restoring initial state).
        await iframeAPI.executeCommand('toggleCameraMirror');

        await p1.driver.waitUntil(
            async () => await getLocalFlipX() === initialFlipX,
            {
                timeout: 5000,
                timeoutMsg: 'localFlipX was not restored'
            }
        );

        await p1.driver.waitUntil(
            async () => await isLocalVideoFlipped() === initialFlipX,
            {
                timeout: 5000,
                timeoutMsg: 'local video flipVideoX class was not restored'
            }
        );
    });
});
