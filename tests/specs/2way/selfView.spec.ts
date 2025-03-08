import type { Participant } from '../../helpers/Participant';
import { ensureTwoParticipants } from '../../helpers/participants';

describe('Self view', () => {
    it('joining the meeting', () => ensureTwoParticipants(ctx));

    it('hide from menu', async () => {
        const { p1 } = ctx;

        await checkSelfViewHidden(p1, false);

        await p1.getFilmstrip().hideSelfView();

        await checkSelfViewHidden(p1, true, true);

        await p1.getToolbar().clickEnterTileViewButton();

        await checkSelfViewHidden(p1, true);
    });

    it('show from settings', async () => {
        const { p1 } = ctx;

        await toggleSelfViewFromSettings(p1, false);

        await checkSelfViewHidden(p1, false);
    });

    it('hide from settings', async () => {
        const { p1 } = ctx;

        await toggleSelfViewFromSettings(p1, true);
        await checkSelfViewHidden(p1, true, true);
    });

    it('check in alone meeting', async () => {
        const { p1, p2 } = ctx;

        await checkSelfViewHidden(p1, true);
        await p2.hangup();
        await checkSelfViewHidden(p1, true);
    });
});

/**
 * Toggles the self view option from the settings dialog.
 */
async function toggleSelfViewFromSettings(participant: Participant, hide: boolean) {
    await participant.getToolbar().clickSettingsButton();

    const settings = participant.getSettingsDialog();

    await settings.waitForDisplay();
    await settings.setHideSelfView(hide);
    await settings.submit();
}

/**
 * Checks whether the local self view is displayed or not.
 */
async function checkSelfViewHidden(participant: Participant, hidden: boolean, checkNotification = false) {
    if (checkNotification) {
        await participant.getNotifications().waitForReEnableSelfViewNotification();
        await participant.getNotifications().closeReEnableSelfViewNotification();
    }

    await participant.getFilmstrip().assertSelfViewIsHidden(hidden);
}
