import { Participant } from '../../helpers/Participant';
import { ensureTwoParticipants } from '../../helpers/participants';

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
    let p1: Participant, p2: Participant;

    before('join the meeting', async () => {
        await ensureTwoParticipants();
        p1 = ctx.p1;
        p2 = ctx.p2;
    });
    it('entering tile view', async () => {
        await p1.getToolbar().clickEnterTileViewButton();
        await p1.waitForTileViewDisplayed();
    });
    it('exit tile view by pinning', async () => {
        await p1.getFilmstrip().pinParticipant(p2);
        await p1.waitForTileViewDisplayed(true);
    });
    it('local video is displayed in tile view', async () => {
        await p1.getToolbar().clickEnterTileViewButton();
        await p1.waitForTileViewDisplayed();
        await p1.driver.$(TILE_VIEW_LOCAL_VIDEO_CSS_SELECTOR).waitForDisplayed({ timeout: 3000 });
        await p1.driver.$(FILMSTRIP_VIEW_LOCAL_VIDEO_CSS_SELECTOR).waitForDisplayed({
            timeout: 3000,
            reverse: true
        });
    });
    it('exit tile view by clicking "exit tile view"', async () => {
        await p1.getToolbar().clickExitTileViewButton();
        await p1.waitForTileViewDisplayed(true);
    });
    it('local video display independently from remote', async () => {
        await p1.driver.$(TILE_VIEW_LOCAL_VIDEO_CSS_SELECTOR).waitForDisplayed({
            timeout: 3000,
            reverse: true
        });
        await p1.driver.$(FILMSTRIP_VIEW_LOCAL_VIDEO_CSS_SELECTOR).waitForDisplayed({ timeout: 3000 });
    });
});
