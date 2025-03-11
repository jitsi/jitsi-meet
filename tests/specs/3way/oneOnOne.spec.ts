import type { Participant } from '../../helpers/Participant';
import {
    ensureThreeParticipants,
    ensureTwoParticipants
} from '../../helpers/participants';

const ONE_ON_ONE_CONFIG_OVERRIDES = {
    configOverwrite: {
        disable1On1Mode: false,
        toolbarConfig: {
            timeout: 500,
            alwaysVisible: false
        }
    }
};

describe('OneOnOne', () => {
    it('filmstrip hidden in 1on1', async () => {
        await ensureTwoParticipants(ctx, ONE_ON_ONE_CONFIG_OVERRIDES);

        const { p1, p2 } = ctx;

        await configureToolbarsToHideQuickly(p1);
        await configureToolbarsToHideQuickly(p2);

        await p1.getFilmstrip().verifyRemoteVideosDisplay(false);
        await p2.getFilmstrip().verifyRemoteVideosDisplay(false);
    });

    it('filmstrip visible with more than 2', async () => {
        await ensureThreeParticipants(ctx, ONE_ON_ONE_CONFIG_OVERRIDES);

        const { p1, p2, p3 } = ctx;

        await configureToolbarsToHideQuickly(p3);

        await p1.getFilmstrip().verifyRemoteVideosDisplay(true);
        await p2.getFilmstrip().verifyRemoteVideosDisplay(true);
        await p3.getFilmstrip().verifyRemoteVideosDisplay(true);
    });

    it('filmstrip display when returning to 1on1', async () => {
        const { p1, p2, p3 } = ctx;

        await p2.getFilmstrip().pinParticipant(p2);

        await p3.hangup();

        await p1.getFilmstrip().verifyRemoteVideosDisplay(false);
        await p2.getFilmstrip().verifyRemoteVideosDisplay(true);
    });

    it('filmstrip visible on self view focus', async () => {
        const { p1 } = ctx;

        await p1.getFilmstrip().pinParticipant(p1);
        await p1.getFilmstrip().verifyRemoteVideosDisplay(true);

        await p1.getFilmstrip().unpinParticipant(p1);
        await p1.getFilmstrip().verifyRemoteVideosDisplay(false);
    });

    it('filmstrip hover show videos', async () => {
        const { p1 } = ctx;

        await p1.getFilmstrip().hoverOverLocalVideo();

        await p1.getFilmstrip().verifyRemoteVideosDisplay(true);
    });
});

/**
 * Hangs up all participants (p1, p2 and p3)
 * @returns {Promise<void>}
 */
function configureToolbarsToHideQuickly(participant: Participant): Promise<void> {
    return participant.execute(() => {
        APP.UI.dockToolbar(false);
        APP.UI.showToolbar(250);
    });
}
