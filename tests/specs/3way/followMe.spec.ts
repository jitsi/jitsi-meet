import { ensureThreeParticipants, ensureTwoParticipants } from '../../helpers/participants';

describe('Follow Me', () => {
    it('joining the meeting', async () => {
        await ensureTwoParticipants(ctx);

        const { p1 } = ctx;

        await p1.getToolbar().clickSettingsButton();

        const settings = p1.getSettingsDialog();

        await settings.waitForDisplay();
        await settings.setFollowMe(true);
        await settings.submit();
    });

    it('follow me checkbox visible only for moderators', async () => {
        const { p2 } = ctx;

        if (!await p2.isModerator()) {
            await p2.getToolbar().clickSettingsButton();

            const settings = p2.getSettingsDialog();

            await settings.waitForDisplay();
            expect(await settings.isFollowMeDisplayed()).toBe(false);

            await settings.clickCloseButton();
        }
    });

    it('filmstrip commands', async () => {
        const { p1, p2 } = ctx;

        const p1Filmstrip = p1.getFilmstrip();
        const p2Filmstrip = p2.getFilmstrip();

        await p1Filmstrip.toggle();

        await p1Filmstrip.assertRemoteVideosHidden();
        await p2Filmstrip.assertRemoteVideosHidden();
    });

    it('tile view', async () => {
        await ensureThreeParticipants(ctx);

        const { p1, p2, p3 } = ctx;

        await p1.waitForTileViewDisplay();

        await p1.getToolbar().clickExitTileViewButton();

        await Promise.all([
            p1.waitForTileViewDisplay(true),
            p2.waitForTileViewDisplay(true),
            p3.waitForTileViewDisplay(true)
        ]);

        await p1.getToolbar().clickEnterTileViewButton();

        await Promise.all([
            p1.waitForTileViewDisplay(),
            p2.waitForTileViewDisplay(),
            p3.waitForTileViewDisplay()
        ]);
    });

    it('next on stage', async () => {
        const { p1, p2, p3 } = ctx;

        await p1.getFilmstrip().pinParticipant(p2);

        const p2Filmstrip = p2.getFilmstrip();
        const localVideoId = await p2Filmstrip.getLocalVideoId();

        await p2.driver.waitUntil(
            async () => await localVideoId === await p2.getLargeVideo().getId(),
            {
                timeout: 5_000,
                timeoutMsg: 'The pinned participant is not displayed on stage for p2'
            });

        const p2VideoIdOnp3 = await p3.getFilmstrip().getRemoteVideoId(await p2.getEndpointId());

        await p3.driver.waitUntil(
            async () => p2VideoIdOnp3 === await p3.getLargeVideo().getId(),
            {
                timeout: 5_000,
                timeoutMsg: 'The pinned participant is not displayed on stage for p3'
            });
    });
});
