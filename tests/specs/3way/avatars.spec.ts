import {
    ensureThreeParticipants,
    ensureTwoParticipants,
    unmuteVideoAndCheck
} from '../../helpers/participants';

const EMAIL = 'support@jitsi.org';
const HASH = '38f014e4b7dde0f64f8157d26a8c812e';

describe('Avatar', () => {
    it('setup the meeting', () =>
        ensureTwoParticipants(ctx, {
            skipDisplayName: true
        })
    );

    it('change and check', async () => {
        const { p1, p2 } = ctx;

        // check default avatar for p1 on p2
        await p2.assertDefaultAvatarExist(p1);

        await p1.getToolbar().clickProfileButton();

        const settings = p1.getSettingsDialog();

        await settings.waitForDisplay();
        await settings.setEmail(EMAIL);
        await settings.submit();

        // check if the local avatar in the toolbar menu has changed
        await p1.driver.waitUntil(
             async () => (await p1.getToolbar().getProfileImage())?.includes(HASH), {
                 timeout: 3000, // give more time for the initial download of the image
                 timeoutMsg: 'Avatar has not changed for p1'
             });

        // check if the avatar in the local thumbnail has changed
        expect(await p1.getLocalVideoAvatar()).toContain(HASH);

        const p1EndpointId = await p1.getEndpointId();

        await p2.driver.waitUntil(
            async () => (await p2.getFilmstrip().getAvatar(p1EndpointId))?.includes(HASH), {
                timeout: 5000,
                timeoutMsg: 'Avatar has not changed for p1 on p2'
            });

        // check if the avatar in the large video has changed
        expect(await p2.getLargeVideo().getAvatar()).toContain(HASH);

        // we check whether the default avatar of participant2 is displayed on both sides
        await p1.assertDefaultAvatarExist(p2);
        await p2.assertDefaultAvatarExist(p2);

        // the problem on FF where we can send keys to the input field,
        // and the m from the text can mute the call, check whether we are muted
        await p2.getFilmstrip().assertAudioMuteIconIsDisplayed(p1, true);
    });

    it('when video muted', async () => {
        const { p1 } = ctx;

        await ctx.p2.hangup();

        // Mute p1's video
        await p1.getToolbar().clickVideoMuteButton();

        await p1.getParticipantsPane().assertVideoMuteIconIsDisplayed(p1);

        await p1.driver.waitUntil(
            async () => (await p1.getLargeVideo().getAvatar())?.includes(HASH), {
                timeout: 2000,
                timeoutMsg: 'Avatar on large video did not change'
            });

        const p1LargeSrc = await p1.getLargeVideo().getAvatar();
        const p1ThumbSrc = await p1.getLocalVideoAvatar();

        // Check if avatar on large video is the same as on local thumbnail
        expect(p1ThumbSrc).toBe(p1LargeSrc);

        // Join p2
        await ensureTwoParticipants(ctx, {
            skipDisplayName: true
        });
        const { p2 } = ctx;

        // Verify that p1 is muted from the perspective of p2
        await p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(p1);

        await p2.getFilmstrip().pinParticipant(p1);

        // Check if p1's avatar is on large video now
        await p2.driver.waitUntil(
              async () => await p2.getLargeVideo().getAvatar() === p1LargeSrc, {
                  timeout: 2000,
                  timeoutMsg: 'Avatar on large video did not change'
              });

        // p1 pins p2's video
        await p1.getFilmstrip().pinParticipant(p2);

        // Check if avatar is displayed on p1's local video thumbnail
        await p1.assertThumbnailShowsAvatar(p1, false, false, true);

        // Unmute - now local avatar should be hidden and local video displayed
        await unmuteVideoAndCheck(p1, p2);

        await p1.asserLocalThumbnailShowsVideo();

        // Now both p1 and p2 have video muted
        await p1.getToolbar().clickVideoMuteButton();
        await p1.getParticipantsPane().assertVideoMuteIconIsDisplayed(p1);
        await p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(p1);

        await p2.getToolbar().clickVideoMuteButton();
        await p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(p2);
        await p1.getParticipantsPane().assertVideoMuteIconIsDisplayed(p2);

        // Start the third participant
        await ensureThreeParticipants(ctx, {
            skipInMeetingChecks: true
        });

        const { p3 } = ctx;

        // When the first participant is FF because of their audio mic feed it will never become dominant speaker
        // and no audio track will be received by the third participant and video is muted,
        // that's why we need to do a different check that expects any track just from p2
        if (p1.driver.isFirefox) {
            await Promise.all([ p2.waitForRemoteStreams(1), p3.waitForRemoteStreams(1) ]);
        } else {
            await Promise.all([ p2.waitForRemoteStreams(2), p3.waitForRemoteStreams(2) ]);
        }

        // Pin local video and verify avatars are displayed
        await p3.getFilmstrip().pinParticipant(p3);

        await p3.assertThumbnailShowsAvatar(p1, false, false, true);
        await p3.assertThumbnailShowsAvatar(p2, false, true);

        const p1EndpointId = await p1.getEndpointId();
        const p2EndpointId = await p2.getEndpointId();

        expect(await p3.getFilmstrip().getAvatar(p1EndpointId)).toBe(p1ThumbSrc);

        // Click on p1's video
        await p3.getFilmstrip().pinParticipant(p1);

        // The avatar should be on large video and display name instead of an avatar, local video displayed
        await p3.driver.waitUntil(
            async () => await p3.getLargeVideo().getResource() === p1EndpointId, {
                timeout: 2000,
                timeoutMsg: `Large video did not switch to ${p1.name}`
            });

        await p3.assertDisplayNameVisibleOnStage(
            await p3.getFilmstrip().getRemoteDisplayName(p1EndpointId));

        // p2 has the default avatar
        await p3.assertThumbnailShowsAvatar(p2, false, true);
        await p3.assertThumbnailShowsAvatar(p3, true);

        // Click on p2's video
        await p3.getFilmstrip().pinParticipant(p2);

        // The avatar should be on large video and display name instead of an avatar, local video displayed
        await p3.driver.waitUntil(
            async () => await p3.getLargeVideo().getResource() === p2EndpointId, {
                timeout: 2000,
                timeoutMsg: `Large video did not switch to ${p2.name}`
            });

        await p3.assertDisplayNameVisibleOnStage(
            await p3.getFilmstrip().getRemoteDisplayName(p2EndpointId)
        );

        await p3.assertThumbnailShowsAvatar(p1, false, false, true);
        await p3.assertThumbnailShowsAvatar(p3, true);

        await p3.hangup();

        // Unmute p1's and p2's videos
        await unmuteVideoAndCheck(p1, p2);
    });

    it('email persistence', async () => {
        let { p1 } = ctx;

        if (p1.driver.isFirefox) {
            // strangely this test when FF is involved, missing source mapping from jvb
            // and fails with an error of: expected number of remote streams:1 in 15s for participant1
            return;
        }

        await p1.getToolbar().clickProfileButton();

        expect(await p1.getSettingsDialog().getEmail()).toBe(EMAIL);

        await p1.hangup();

        await ensureTwoParticipants(ctx, {
            skipDisplayName: true
        });
        p1 = ctx.p1;

        await p1.getToolbar().clickProfileButton();

        expect(await p1.getSettingsDialog().getEmail()).toBe(EMAIL);
    });
});
