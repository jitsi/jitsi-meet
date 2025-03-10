import {
    ensureOneParticipant,
    ensureThreeParticipants,
    ensureTwoParticipants,
    hangupAllParticipants
} from '../../helpers/participants';

describe('Codec selection', () => {
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
        expect(await p1.execute(() => JitsiMeetJS.app.testing.isLargeVideoReceived())).toBe(true);
        expect(await p2.execute(() => JitsiMeetJS.app.testing.isLargeVideoReceived())).toBe(true);

        // Check if p1 is sending VP9 and p2 is sending VP8 as per their codec preferences.
        // Except on Firefox because it doesn't support VP9 encode.
        const majorVersion = parseInt(p1.driver.capabilities.browserVersion || '0', 10);

        if (p1.driver.isFirefox && majorVersion < 136) {
            expect(await p1.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp8())).toBe(true);
        } else {
            expect(await p1.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp9())).toBe(true);
        }

        expect(await p2.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp8())).toBe(true);
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
        expect(await p3.execute(() => JitsiMeetJS.app.testing.isLargeVideoReceived())).toBe(true);

        // Check if p1 is encoding in VP9, p2 in VP8 and p3 in AV1 as per their codec preferences.
        // Except on Firefox because it doesn't support AV1/VP9 encode and AV1 decode.
        const majorVersion = parseInt(p1.driver.capabilities.browserVersion || '0', 10);

        if (p1.driver.isFirefox && majorVersion < 136) {
            expect(await p1.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp8())).toBe(true);
        } else {
            expect(await p1.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp9())).toBe(true);
        }

        expect(await p2.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp8())).toBe(true);

        // If there is a Firefox ep in the call, all other eps will switch to VP9.
        if (p1.driver.isFirefox && majorVersion < 136) {
            expect(await p3.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp9())).toBe(true);
        } else {
            expect(await p3.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingAv1())).toBe(true);
        }
    });

    it('codec switch over', async () => {
        await hangupAllParticipants();

        await ensureTwoParticipants(ctx, {
            configOverwrite: {
                videoQuality: {
                    codecPreferenceOrder: [ 'VP9', 'VP8', 'AV1' ]
                }
            }
        });
        const { p1, p2 } = ctx;

        // Disable this test on Firefox because it doesn't support VP9 encode.
        const majorVersion = parseInt(p1.driver.capabilities.browserVersion || '0', 10);

        if (p1.driver.isFirefox && majorVersion < 136) {
            return;
        }

        // Check if p1 and p2 are encoding in VP9 which is the default codec.
        expect(await p1.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp9())).toBe(true);
        expect(await p2.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp9())).toBe(true);

        await ensureThreeParticipants(ctx, {
            configOverwrite: {
                videoQuality: {
                    codecPreferenceOrder: [ 'VP8' ]
                }
            }
        });
        const { p3 } = ctx;

        // Check if all three participants are encoding in VP8 now.
        expect(await p1.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp8())).toBe(true);
        expect(await p2.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp8())).toBe(true);
        expect(await p3.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp8())).toBe(true);

        await p3.hangup();

        // Check of p1 and p2 have switched to VP9.
        await p1.driver.waitUntil(
            () => p1.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp9()),
            {
                timeout: 10000,
                timeoutMsg: 'p1 did not switch back to VP9'
            }
        );
        await p2.driver.waitUntil(
            () => p2.execute(() => JitsiMeetJS.app.testing.isLocalCameraEncodingVp9()),
            {
                timeout: 10000,
                timeoutMsg: 'p1 did not switch back to VP9'
            }
        );
    });
});
