import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';

setTestProperties(__filename, {
    description: 'The Experimental tab of the settings dialog lets a user turn browser Picture-in-Picture on and off '
        + 'when the deployment leaves it unset. The choice applies right away and is remembered by the browser for '
        + 'later meetings.',
    usesBrowsers: [ 'p1' ]
});

/**
 * The toolbar button is the visible effect of the setting, so it must not be hidden by the deployment. Leaves
 * pip.enableBrowserPiP alone: URL parameters merge into the deployment's config, and a value set there is final and
 * would hide the setting the test is about.
 */
const JOIN_OPTIONS = {
    configOverwrite: {
        pip: {
            showToolbarButton: true
        }
    }
};

describe('Picture-in-Picture setting', () => {
    it('joining the meeting', async () => {
        await ensureOneParticipant(JOIN_OPTIONS);

        const { p1 } = ctx;
        const settings = await openSettings(p1);

        if (!await settings.hasExperimentalTab()) {
            // The tab has nothing to offer, and is hidden, in a browser without a Picture-in-Picture API and on a
            // deployment whose config sets pip.enableBrowserPiP.
            ctx.skipSuiteTests = 'Browser Picture-in-Picture is not left to the user here';
        }

        await settings.clickCloseButton();
    });

    it('is off by default', async () => {
        const { p1 } = ctx;

        expect(await isPiPEnabledInSettings(p1)).toBe(false);
        expect(await p1.getToolbar().hasPictureInPictureButton()).toBe(false);
    });

    it('turning it on applies right away', async () => {
        const { p1 } = ctx;

        await setPiPEnabledInSettings(p1, true);

        expect(await p1.getToolbar().hasPictureInPictureButton()).toBe(true);
    });

    it('the choice is remembered when joining again', async () => {
        await ctx.p1.hangup();
        await ensureOneParticipant(JOIN_OPTIONS);

        const { p1 } = ctx;

        expect(await p1.getToolbar().hasPictureInPictureButton()).toBe(true);
        expect(await isPiPEnabledInSettings(p1)).toBe(true);
    });

    it('turning it off applies right away', async () => {
        const { p1 } = ctx;

        await setPiPEnabledInSettings(p1, false);

        expect(await p1.getToolbar().hasPictureInPictureButton()).toBe(false);
    });
});

/**
 * Opens the settings dialog and waits for it to be displayed.
 */
async function openSettings(participant: Participant) {
    await participant.getToolbar().clickSettingsButton();

    const settings = participant.getSettingsDialog();

    await settings.waitForDisplay();

    return settings;
}

/**
 * Reads the state of the Picture-in-Picture switch in the Experimental tab of the settings dialog.
 */
async function isPiPEnabledInSettings(participant: Participant) {
    const settings = await openSettings(participant);
    const enabled = await settings.isPictureInPictureEnabled();

    await settings.clickCloseButton();

    return enabled;
}

/**
 * Switches Picture-in-Picture on or off in the Experimental tab of the settings dialog and submits the dialog.
 */
async function setPiPEnabledInSettings(participant: Participant, enable: boolean) {
    const settings = await openSettings(participant);

    await settings.setPictureInPictureEnabled(enable);
    await settings.submit();
}
