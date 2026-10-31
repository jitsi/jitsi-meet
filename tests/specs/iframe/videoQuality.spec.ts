import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

describe('Video quality iframe API command and event', () => {
    let p1: Participant;
    let initialQuality: number;

    /**
     * Reads the current preferredVideoQuality setting from the redux store inside the meeting iframe,
     * and ensures the browsing context is restored to the main frame.
     */
    async function getPreferredVideoQuality(): Promise<number> {
        await p1.switchToIFrame();
        try {
            return await p1.execute(() => APP.store.getState()['features/video-quality']?.preferredVideoQuality);
        } finally {
            await p1.switchToMainFrame();
        }
    }

    it('joining the meeting', async () => {
        await ensureOneParticipant({}, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
        await p1.getIframeAPI().addEventListener('videoQualityChanged');

        initialQuality = await getPreferredVideoQuality();
    });

    afterEach(async () => {
        if (!p1) {
            return;
        }

        const currentQuality = await getPreferredVideoQuality();

        if (currentQuality !== initialQuality) {
            await p1.switchToMainFrame();
            await p1.getIframeAPI().setVideoQuality(initialQuality);
            await p1.driver.waitUntil(
                async () => await getPreferredVideoQuality() === initialQuality,
                {
                    timeout: 5000,
                    timeoutMsg: `Failed to restore initial video quality ${initialQuality}`
                }
            );
        }
    });

    it('changes video quality via setVideoQuality and fires videoQualityChanged event', async () => {
        const iframeAPI = p1.getIframeAPI();
        const targetQuality = initialQuality === 720 ? 360 : 720;

        await p1.switchToMainFrame();
        await iframeAPI.clearEventResults('videoQualityChanged');
        await iframeAPI.setVideoQuality(targetQuality);

        // 1. Verify Redux state updates.
        await p1.driver.waitUntil(
            async () => await getPreferredVideoQuality() === targetQuality,
            {
                timeout: 5000,
                timeoutMsg: `Expected video quality to be updated to ${targetQuality} in redux`
            }
        );

        // 2. Verify external API videoQualityChanged event payload.
        await p1.driver.waitUntil(
            async () => (await iframeAPI.getEventResult('videoQualityChanged'))?.videoQuality === targetQuality,
            {
                timeout: 5000,
                timeoutMsg: `Expected videoQualityChanged event with videoQuality ${targetQuality}`
            }
        );

        // 3. Verify external API getter getVideoQuality().
        expect(await iframeAPI.getVideoQuality()).toBe(targetQuality);
    });

    it('clamps video quality exceeding MAX_VIDEO_QUALITY (2160)', async () => {
        const iframeAPI = p1.getIframeAPI();

        await p1.switchToMainFrame();
        await iframeAPI.clearEventResults('videoQualityChanged');
        await iframeAPI.setVideoQuality(4000);

        // MAX_VIDEO_QUALITY in features/video-quality is 2160 (ULTRA).
        await p1.driver.waitUntil(
            async () => await getPreferredVideoQuality() === 2160,
            {
                timeout: 5000,
                timeoutMsg: 'Expected video quality to be clamped to 2160'
            }
        );

        await p1.driver.waitUntil(
            async () => (await iframeAPI.getEventResult('videoQualityChanged'))?.videoQuality === 2160,
            {
                timeout: 5000,
                timeoutMsg: 'Expected videoQualityChanged event with clamped value 2160'
            }
        );

        expect(await iframeAPI.getVideoQuality()).toBe(2160);
    });

    it('rejects invalid video quality below minimum threshold (180)', async () => {
        const iframeAPI = p1.getIframeAPI();

        // Establish known baseline
        await p1.switchToMainFrame();
        await iframeAPI.setVideoQuality(360);
        await p1.driver.waitUntil(
            async () => await getPreferredVideoQuality() === 360,
            {
                timeout: 5000,
                timeoutMsg: 'Failed to establish 360p baseline'
            }
        );

        await iframeAPI.clearEventResults('videoQualityChanged');

        // Pass invalid quality (< 180 LOW threshold)
        await iframeAPI.setVideoQuality(100);

        // Allow any event cycle to pass
        await p1.driver.pause(500);

        // Verify quality remains unchanged
        expect(await getPreferredVideoQuality()).toBe(360);
        expect(await iframeAPI.getEventResult('videoQualityChanged')).toBeUndefined();
    });
});
