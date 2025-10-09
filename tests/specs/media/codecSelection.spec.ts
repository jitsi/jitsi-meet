import { VIDEO_CODEC } from '../../../react/features/video-quality/constants';
import { setTestProperties } from '../../helpers/TestProperties';
import {
    ensureOneParticipant,
    ensureThreeParticipants,
    ensureTwoParticipants,
    hangupAllParticipants
} from '../../helpers/participants';
const { VP8, VP9, AV1 } = VIDEO_CODEC;

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2', 'p3' ]
});

describe('Codec selection', () => {
    it('asymmetric codecs', async () => {
        await ensureOneParticipant({
            configOverwrite: {
                videoQuality: {
                    codecPreferenceOrder: [ 'VP9', 'VP8', 'AV1' ]
                }
            }
        });

        await ensureTwoParticipants({
            configOverwrite: {
                videoQuality: {
                    codecPreferenceOrder: [ 'VP8', 'VP9', 'AV1' ]
                }
            }
        });
        const { p1, p2 } = ctx;

        // Check if media is playing on both endpoints.
        expect(await p1.execute(() => JitsiMeetJS.app.testing.isLargeVideoReceived())).toBe(true);
        expect(await p2.execute(() => JitsiMeetJS.app.testing.isLargeVideoReceived())).toBe(true);

        // Check if p1 is sending VP9 and p2 is sending VP8 as per their codec preferences.
        // Except on Firefox because it doesn't support VP9 encode.
        const p1ExpectedCodec = p1.driver.isFirefox ? VP8 : VP9;

        expect(await p1.execute(() => JitsiMeetJS.app.testing.getLocalCameraEncoding())).toBe(p1ExpectedCodec);
        expect(await p2.execute(() => JitsiMeetJS.app.testing.getLocalCameraEncoding())).toBe(VP8);
    });

    it('asymmetric codecs with AV1', async () => {
        await ensureThreeParticipants({
            configOverwrite: {
                disableTileView: true,
                videoQuality: {
                    codecPreferenceOrder: [ 'AV1', 'VP9', 'VP8' ]
                }
            }
        });
        const { p1, p2, p3 } = ctx;

        // Check if media is playing on p3.
        expect(await p3.execute(() => JitsiMeetJS.app.testing.isLargeVideoReceived())).toBe(true);

        const majorVersion = parseInt(p1.driver.capabilities.browserVersion || '0', 10);

        // Check if p1 is encoding in VP9, p2 in VP8 and p3 in AV1 as per their codec preferences.
        // Except on Firefox because it doesn't support VP9 encode.
        const p1ExpectedCodec = p1.driver.isFirefox ? VP8 : VP9;

        expect(await p1.execute(() => JitsiMeetJS.app.testing.getLocalCameraEncoding())).toBe(p1ExpectedCodec);
        expect(await p2.execute(() => JitsiMeetJS.app.testing.getLocalCameraEncoding())).toBe(VP8);

        // If there is a Firefox ep in the call, all other eps will switch to VP9.
        if (p1.driver.isFirefox && majorVersion < 136) {
            expect(await p3.execute(() => JitsiMeetJS.app.testing.getLocalCameraEncoding())).toBe(VP9);
        } else {
            expect(await p3.execute(() => JitsiMeetJS.app.testing.getLocalCameraEncoding())).toBe(AV1);
        }
    });

    it('codec switch over', async () => {
        await hangupAllParticipants();

        await ensureTwoParticipants({
            configOverwrite: {
                videoQuality: {
                    codecPreferenceOrder: [ 'VP9', 'VP8', 'AV1' ]
                }
            }
        });
        const { p1, p2 } = ctx;

        // Disable this test on Firefox because it doesn't support VP9 encode.
        if (p1.driver.isFirefox) {
            return;
        }

        // Check if p1 and p2 are encoding in VP9 which is the default codec.
        expect(await p1.execute(() => JitsiMeetJS.app.testing.getLocalCameraEncoding())).toBe(VP9);
        expect(await p2.execute(() => JitsiMeetJS.app.testing.getLocalCameraEncoding())).toBe(VP9);

        await ensureThreeParticipants({
            configOverwrite: {
                disableTileView: true,
                videoQuality: {
                    codecPreferenceOrder: [ 'VP8' ]
                }
            }
        });
        const { p3 } = ctx;

        // Check if all three participants are encoding in VP8 now.
        expect(await p1.execute(() => JitsiMeetJS.app.testing.getLocalCameraEncoding())).toBe(VP8);
        expect(await p2.execute(() => JitsiMeetJS.app.testing.getLocalCameraEncoding())).toBe(VP8);
        expect(await p3.execute(() => JitsiMeetJS.app.testing.getLocalCameraEncoding())).toBe(VP8);

        await p3.hangup();

        // Check of p1 and p2 have switched to VP9.
        await p1.driver.waitUntil(
            () => p1.execute(c => JitsiMeetJS.app.testing.getLocalCameraEncoding() === c, VP9),
            {
                timeout: 10000,
                timeoutMsg: 'p1 did not switch back to VP9'
            }
        );
        await p2.driver.waitUntil(
            () => p2.execute(c => JitsiMeetJS.app.testing.getLocalCameraEncoding() === c, VP9),
            {
                timeout: 10000,
                timeoutMsg: 'p2 did not switch back to VP9'
            }
        );
    });
});
