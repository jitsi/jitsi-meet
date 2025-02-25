import { ensureThreeParticipants, ensureTwoParticipants } from '../../helpers/participants';

/**
 * The CSS selector for local video when outside of tile view. It should
 * be in a container separate from remote videos so remote videos can
 * scroll while local video stays docked.
 */
const FILMSTRIP_VIEW_LOCAL_VIDEO_CSS_SELECTOR = '#filmstripLocalVideo #localVideoContainer';

/**
 * The CSS selector for local video tile view is enabled. It should display
 * at the end of all the other remote videos, as the last tile.
 */
const TILE_VIEW_LOCAL_VIDEO_CSS_SELECTOR = '.remote-videos #localVideoContainer';

describe('TileView', () => {
    it('joining the meeting', () => ensureTwoParticipants(ctx));

    // TODO: implements etherpad check

    it('pinning exits', async () => {
        await enterTileView();

        const { p1, p2 } = ctx;

        await p1.getFilmstrip().pinParticipant(p2);

        await p1.waitForTileViewDisplay(true);
    });

    it('local video display', async () => {
        await enterTileView();

        const { p1 } = ctx;

        await p1.driver.$(TILE_VIEW_LOCAL_VIDEO_CSS_SELECTOR).waitForDisplayed({ timeout: 3000 });
        await p1.driver.$(FILMSTRIP_VIEW_LOCAL_VIDEO_CSS_SELECTOR).waitForDisplayed({
            timeout: 3000,
            reverse: true
        });
    });

    it('can exit', async () => {
        const { p1 } = ctx;

        await p1.getToolbar().clickExitTileViewButton();
        await p1.waitForTileViewDisplay(true);
    });

    it('local video display independently from remote', async () => {
        const { p1 } = ctx;

        await p1.driver.$(TILE_VIEW_LOCAL_VIDEO_CSS_SELECTOR).waitForDisplayed({
            timeout: 3000,
            reverse: true
        });
        await p1.driver.$(FILMSTRIP_VIEW_LOCAL_VIDEO_CSS_SELECTOR).waitForDisplayed({ timeout: 3000 });
    });

    it('lastN', async () => {
        const { p1, p2 } = ctx;

        if (p1.driver.isFirefox) {
            // Firefox does not support external audio file as input.
            // Not testing as second participant cannot be dominant speaker.
            return;
        }

        await p2.getToolbar().clickAudioMuteButton();

        await ensureThreeParticipants(ctx, {
            configOverwrite: {
                channelLastN: 1,
                startWithAudioMuted: true
            }
        });

        const { p3 } = ctx;

        // one inactive icon should appear in few seconds
        await p3.waitForNinjaIcon();

        const p1EpId = await p1.getEndpointId();

        await p3.waitForRemoteVideo(p1EpId);

        const p2EpId = await p2.getEndpointId();

        await p3.waitForNinjaIcon(p2EpId);

        // no video for participant 2
        await p3.waitForRemoteVideo(p2EpId, true);

        // mute audio for participant 1
        await p1.getToolbar().clickAudioMuteButton();

        // unmute audio for participant 2
        await p2.getToolbar().clickAudioUnmuteButton();

        await p3.waitForDominantSpeaker(p2EpId);

        // check video of participant 2 should be received
        await p3.waitForRemoteVideo(p2EpId);
    });
});

/**
 * Attempts to enter tile view and verifies tile view has been entered.
 */
async function enterTileView() {
    await ctx.p1.getToolbar().clickEnterTileViewButton();
    await ctx.p1.waitForTileViewDisplay();
}
