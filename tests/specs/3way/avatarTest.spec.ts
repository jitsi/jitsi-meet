import {
    ensureThreeParticipants,
    ensureTwoParticipants,
    unMuteVideoAndCheck
} from '../../helpers/participants';

const EMAIL = 'support@jitsi.org';
const HASH = '38f014e4b7dde0f64f8157d26a8c812e';

describe('Avatar - ', () => {
    it('setup the meeting', async () => {
        // Start p1
        await ensureTwoParticipants(context, {
            skipDisplayName: true
        });
    });

    it('change and check', async () => {
        // check default avatar for p1 on p2
        await context.p2.assertDefaultAvatarExist(context.p1);

        await context.p1.getToolbar().clickProfileButton();

        const settings = context.p1.getSettingsDialog();

        await settings.waitForDisplay();
        await settings.setEmail(EMAIL);
        await settings.submit();

        // check if the local avatar in the toolbar menu has changed
        await context.p1.driver.waitUntil(
             async () => (await context.p1.getToolbar().getProfileImage())?.includes(HASH), {
                 timeout: 3000, // give more time for the initial download of the image
                 timeoutMsg: 'Avatar has not changed for p1'
             });

        // check if the avatar in the local thumbnail has changed
        expect(await context.p1.getLocalVideoAvatar()).toContain(HASH);

        const p1EndpointId = await context.p1.getEndpointId();

        await context.p2.driver.waitUntil(
            async () => (await context.p2.getFilmstrip().getAvatar(p1EndpointId))?.includes(HASH), {
                timeout: 5000,
                timeoutMsg: 'Avatar has not changed for p1 on p2'
            });

        // check if the avatar in the large video has changed
        expect(await context.p2.getLargeVideoAvatar()).toContain(HASH);

        // we check whether the default avatar of participant2 is displayed on both sides
        await context.p1.assertDefaultAvatarExist(context.p2);
        await context.p2.assertDefaultAvatarExist(context.p2);

        // the problem on FF where we can send keys to the input field,
        // and the m from the text can mute the call, check whether we are muted
        await context.p2.getFilmstrip().assertAudioMuteIconIsDisplayed(context.p1, true);
    });

    it('when video muted', async () => {
        await context.p2.hangup();

        // Mute p1's video
        await context.p1.getToolbar().clickVideoMuteButton();

        await context.p1.getParticipantsPane().assertVideoMuteIconIsDisplayed(context.p1);

        await context.p1.driver.waitUntil(
            async () => (await context.p1.getLargeVideoAvatar())?.includes(HASH), {
                timeout: 2000,
                timeoutMsg: 'Avatar on large video did not change'
            });

        const p1LargeSrc = await context.p1.getLargeVideoAvatar();
        const p1ThumbSrc = await context.p1.getLocalVideoAvatar();

        // Check if avatar on large video is the same as on local thumbnail
        expect(p1ThumbSrc).toBe(p1LargeSrc);

        // Join p2
        await ensureTwoParticipants(context, {
            skipDisplayName: true
        });

        // Verify that p1 is muted from the perspective of p2
        await context.p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(context.p1);

        await context.p2.getFilmstrip().pinParticipant(context.p1);

        // Check if p1's avatar is on large video now
        await context.p2.driver.waitUntil(
              async () => await context.p2.getLargeVideoAvatar() === p1LargeSrc, {
                  timeout: 2000,
                  timeoutMsg: 'Avatar on large video did not change'
              });

        // p1 pins p2's video
        await context.p1.getFilmstrip().pinParticipant(context.p2);

        // Check if avatar is displayed on p1's local video thumbnail
        await context.p1.assertThumbnailShowsAvatar(context.p1, false, false, true);

        // Unmute - now local avatar should be hidden and local video displayed
        await unMuteVideoAndCheck(context.p1, context.p2);

        await context.p1.asserLocalThumbnailShowsVideo();

        // Now both p1 and p2 have video muted
        await context.p1.getToolbar().clickVideoMuteButton();
        await context.p1.getParticipantsPane().assertVideoMuteIconIsDisplayed(context.p1);
        await context.p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(context.p1);

        await context.p2.getToolbar().clickVideoMuteButton();
        await context.p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(context.p2);
        await context.p1.getParticipantsPane().assertVideoMuteIconIsDisplayed(context.p2);

        // Start the third participant
        await ensureThreeParticipants(context);

        // Pin local video and verify avatars are displayed
        await context.p3.getFilmstrip().pinParticipant(context.p3);

        await context.p3.assertThumbnailShowsAvatar(context.p1, false, false, true);
        await context.p3.assertThumbnailShowsAvatar(context.p2, false, true);

        const p1EndpointId = await context.p1.getEndpointId();
        const p2EndpointId = await context.p2.getEndpointId();

        expect(await context.p3.getFilmstrip().getAvatar(p1EndpointId)).toBe(p1ThumbSrc);

        // Click on p1's video
        await context.p3.getFilmstrip().pinParticipant(context.p1);

        // The avatar should be on large video and display name instead of an avatar, local video displayed
        await context.p3.driver.waitUntil(
            async () => await context.p3.getLargeVideoResource() === p1EndpointId, {
                timeout: 2000,
                timeoutMsg: `Large video did not switch to ${context.p1.name}`
            });

        await context.p3.assertDisplayNameVisibleOnStage(
            await context.p3.getFilmstrip().getRemoteDisplayName(p1EndpointId));

        // p2 has the default avatar
        await context.p3.assertThumbnailShowsAvatar(context.p2, false, true);
        await context.p3.assertThumbnailShowsAvatar(context.p3, true);

        // Click on p2's video
        await context.p3.getFilmstrip().pinParticipant(context.p2);

        // The avatar should be on large video and display name instead of an avatar, local video displayed
        await context.p3.driver.waitUntil(
            async () => await context.p3.getLargeVideoResource() === p2EndpointId, {
                timeout: 2000,
                timeoutMsg: `Large video did not switch to ${context.p2.name}`
            });

        await context.p3.assertDisplayNameVisibleOnStage(
            await context.p3.getFilmstrip().getRemoteDisplayName(p2EndpointId)
        );

        await context.p3.assertThumbnailShowsAvatar(context.p1, false, false, true);
        await context.p3.assertThumbnailShowsAvatar(context.p3, true);

        await context.p3.hangup();

        // Unmute p1's and p2's videos
        await context.p1.getToolbar().clickVideoUnmuteButton();

        await context.p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(context.p1, true);
        await context.p1.getParticipantsPane().assertVideoMuteIconIsDisplayed(context.p1, true);
    });

    it('email persistence', async () => {
        await context.p1.getToolbar().clickProfileButton();

        expect(await context.p1.getSettingsDialog().getEmail()).toBe(EMAIL);

        await context.p1.hangup();

        await ensureTwoParticipants(context, {
            skipDisplayName: true
        });

        await context.p1.getToolbar().clickProfileButton();

        expect(await context.p1.getSettingsDialog().getEmail()).toBe(EMAIL);
    });
});
