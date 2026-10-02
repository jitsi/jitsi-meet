import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';

setTestProperties(__filename, {
    description: 'The Config tab of the settings dialog lets a user turn browser Picture-in-Picture on and off. '
        + 'The choice is applied to the config right away and remembered by the browser for later meetings.',
    usesBrowsers: [ 'p1' ]
});

/**
 * Starts from an explicit "off" default so that the test does not depend on the deployment's pip config.
 */
const JOIN_OPTIONS = {
    configOverwrite: {
        pip: {
            enableBrowserPiP: false
        }
    }
};

describe('Picture-in-Picture setting', () => {
    it('joining the meeting', async () => {
        await ensureOneParticipant(JOIN_OPTIONS);

        const { p1 } = ctx;
        const settings = await openSettings(p1);

        if (!await settings.hasConfigTab()) {
            // The tab has nothing to offer in a browser without a Picture-in-Picture API and is hidden then.
            ctx.skipSuiteTests = 'The browser does not support Picture-in-Picture';
        }

        await settings.clickCloseButton();
    });

    it('is off by default', async () => {
        const { p1 } = ctx;

        expect(await isPiPEnabledInSettings(p1)).toBe(false);
        expect(await isBrowserPiPEnabledInConfig(p1)).toBe(false);
    });

    it('turning it on applies right away', async () => {
        const { p1 } = ctx;

        await setPiPEnabledInSettings(p1, true);

        expect(await isBrowserPiPEnabledInConfig(p1)).toBe(true);
    });

    it('the choice is remembered when joining again', async () => {
        await ctx.p1.hangup();
        await ensureOneParticipant(JOIN_OPTIONS);

        const { p1 } = ctx;

        expect(await isBrowserPiPEnabledInConfig(p1)).toBe(true);
        expect(await isPiPEnabledInSettings(p1)).toBe(true);
    });

    it('turning it off applies right away', async () => {
        const { p1 } = ctx;

        await setPiPEnabledInSettings(p1, false);

        expect(await isBrowserPiPEnabledInConfig(p1)).toBe(false);
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
 * Reads the state of the Picture-in-Picture switch in the Config tab of the settings dialog.
 */
async function isPiPEnabledInSettings(participant: Participant) {
    const settings = await openSettings(participant);
    const enabled = await settings.isPictureInPictureEnabled();

    await settings.clickCloseButton();

    return enabled;
}

/**
 * Switches Picture-in-Picture on or off in the Config tab of the settings dialog and submits the dialog.
 */
async function setPiPEnabledInSettings(participant: Participant, enable: boolean) {
    const settings = await openSettings(participant);

    await settings.setPictureInPictureEnabled(enable);
    await settings.submit();
}

/**
 * Checks whether browser Picture-in-Picture is enabled in the config the app runs with, which is what every
 * Picture-in-Picture feature reads.
 */
function isBrowserPiPEnabledInConfig(participant: Participant) {
    return participant.execute(
        () => APP.store.getState()['features/base/config'].pip?.enableBrowserPiP === true);
}
