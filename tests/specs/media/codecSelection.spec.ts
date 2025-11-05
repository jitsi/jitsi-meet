import { VIDEO_CODEC } from '../../../react/features/video-quality/constants';
import { Participant } from '../../helpers/Participant';
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

        await Promise.all([
            waitForCodec(p1, p1ExpectedCodec),
            waitForCodec(p2, VP8)
        ]);
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
        const p3ExpectedCodec = (p1.driver.isFirefox && majorVersion < 136) ? VP9 : AV1;

        await Promise.all([
            waitForCodec(p1, p1ExpectedCodec),
            waitForCodec(p2, VP8),
            waitForCodec(p3, p3ExpectedCodec)
        ]);
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
        await Promise.all([
            waitForCodec(p1, VP9),
            waitForCodec(p2, VP9)
        ]);

        await ensureThreeParticipants({
            configOverwrite: {
                disableTileView: true,
                videoQuality: {
                    codecPreferenceOrder: [ 'VP8' ]
                }
            }
        });
        const { p3 } = ctx;

        await Promise.all([
            waitForCodec(p1, VP8),
            waitForCodec(p2, VP8),
            waitForCodec(p3, VP8)
        ]);

        await p3.hangup();

        // Check of p1 and p2 have switched to VP9.
        await Promise.all([
            waitForCodec(p1, VP9),
            waitForCodec(p2, VP9)
        ]);
    });
});

async function waitForCodec(p: Participant, codec: string) {
    await p.driver.waitUntil(
        () => p.execute(c => JitsiMeetJS.app.testing.getLocalCameraEncoding() === c, codec),
        {
            timeout: 10000,
            timeoutMsg: `${p.name} failed to use VP8`
        }
    );
}
