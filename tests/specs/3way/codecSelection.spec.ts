import { ensureOneParticipant, ensureThreeParticipants, ensureTwoParticipants } from '../../helpers/participants';

describe('Codec selection - ', () => {
    it('asymmetric codecs', async () => {
        await ensureOneParticipant(ctx, {
            configOverwrite: {
                videoQuality: {
                    codecPreferenceOrder: [ 'VP9', 'VP8', 'AV1' ]
                }
            }
        });

        await ensureTwoParticipants(ctx, {
            configOverwrite: {
                videoQuality: {
                    codecPreferenceOrder: [ 'VP8', 'VP9', 'AV1' ]
                }
            }
        });
        const { p1, p2 } = ctx;

        // Check if media is playing on both endpoints.
        expect(await p1.driver.execute(() => JitsiMeetJS.app.testing.isLargeVideoReceived())).toBe(true);
        expect(await p2.driver.execute(() => JitsiMeetJS.app.testing.isLargeVideoReceived())).toBe(true);

        // Check if p1 is sending VP9 and p2 is sending VP8 as per their codec preferences.
        // Except on Firefox because it doesn't support VP9 encode.
        if (p1.driver.isFirefox) {
            expect(await p1.driver.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp8())).toBe(true);
        } else {
            expect(await p1.driver.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp9())).toBe(true);
        }

        expect(await p2.driver.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp8())).toBe(true);
    });

    it('asymmetric codecs with AV1', async () => {
        await ensureThreeParticipants(ctx, {
            configOverwrite: {
                videoQuality: {
                    codecPreferenceOrder: [ 'AV1', 'VP9', 'VP8' ]
                }
            }
        });
        const { p1, p2, p3 } = ctx;

        // Check if media is playing on p3.
        expect(await p3.driver.execute(() => JitsiMeetJS.app.testing.isLargeVideoReceived())).toBe(true);

        // Check if p1 is encoding in VP9, p2 in VP8 and p3 in AV1 as per their codec preferences.
        // Except on Firefox because it doesn't support AV1/VP9 encode and AV1 decode.
        if (p1.driver.isFirefox) {
            expect(await p1.driver.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp8())).toBe(true);
        } else {
            expect(await p1.driver.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp9())).toBe(true);
        }

        expect(await p2.driver.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp8())).toBe(true);

        // If there is a Firefox ep in the call, all other eps will switch to VP9.
        if (p1.driver.isFirefox) {
            expect(await p3.driver.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp9())).toBe(true);
        } else {
            expect(await p3.driver.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingAv1())).toBe(true);
        }
    });

    it('codec switch over', async () => {
        await Promise.all([ ctx.p1.hangup(), ctx.p2.hangup(), ctx.p3.hangup() ]);

        await ensureTwoParticipants(ctx, {
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
        expect(await p1.driver.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp9())).toBe(true);
        expect(await p2.driver.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp9())).toBe(true);

        await ensureThreeParticipants(ctx, {
            configOverwrite: {
                videoQuality: {
                    codecPreferenceOrder: [ 'VP8' ]
                }
            }
        });
        const { p3 } = ctx;

        // Check if all three participants are encoding in VP8 now.
        expect(await p1.driver.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp8())).toBe(true);
        expect(await p2.driver.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp8())).toBe(true);
        expect(await p3.driver.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp8())).toBe(true);

        await p3.hangup();

        // Check of p1 and p2 have switched to VP9.
        await p1.driver.waitUntil(
            async () => await p1.driver.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp9()),
            {
                timeout: 10000,
                timeoutMsg: 'p1 did not switch back to VP9'
            }
        );
        await p2.driver.waitUntil(
            async () => await p2.driver.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp9()),
            {
                timeout: 10000,
                timeoutMsg: 'p1 did not switch back to VP9'
            }
        );
    });
});
