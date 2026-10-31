import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

describe('Video quality iframe API command and event', () => {
    let p1: Participant;

    it('joining the meeting', async () => {
        await ensureOneParticipant({}, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
        await p1.getIframeAPI().addEventListener('videoQualityChanged');
    });

    it('changes video quality via setVideoQuality and fires videoQualityChanged event', async () => {
        const iframeAPI = p1.getIframeAPI();

        await p1.switchToMainFrame();
        await iframeAPI.clearEventResults('videoQualityChanged');
        await iframeAPI.executeCommand('setVideoQuality', 720);

        const eventResult: { videoQuality: number; } = await iframeAPI.waitForEventResult(
            'videoQualityChanged',
            'videoQualityChanged event was not received for target quality 720'
        );

        expect(eventResult?.videoQuality).toBe(720);
        expect(await iframeAPI.getVideoQuality()).toBe(720);
    });

    it('clamps video quality exceeding MAX_VIDEO_QUALITY (2160)', async () => {
        const iframeAPI = p1.getIframeAPI();

        await p1.switchToMainFrame();
        await iframeAPI.clearEventResults('videoQualityChanged');
        await iframeAPI.executeCommand('setVideoQuality', 4000);

        // MAX_VIDEO_QUALITY is 2160 (ULTRA). Since the previous step set 720,
        // this change reliably fires videoQualityChanged with 2160.
        const eventResult: { videoQuality: number; } = await iframeAPI.waitForEventResult(
            'videoQualityChanged',
            'Expected videoQualityChanged event with clamped value 2160'
        );

        expect(eventResult?.videoQuality).toBe(2160);
        expect(await iframeAPI.getVideoQuality()).toBe(2160);
    });

    it('rejects invalid video quality below minimum threshold (180)', async () => {
        const iframeAPI = p1.getIframeAPI();

        await p1.switchToMainFrame();
        await iframeAPI.clearEventResults('videoQualityChanged');
        await iframeAPI.executeCommand('setVideoQuality', 100);

        // Round trip: messages to iframe are handled in order, so a request acts as a barrier
        await iframeAPI.isAudioMuted();

        expect(await iframeAPI.getEventResult('videoQualityChanged')).toBe(false);
        expect(await iframeAPI.getVideoQuality()).toBe(2160);
    });
});
