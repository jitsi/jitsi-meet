import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';
import { CANCEL_BUTTON, CLOSE_BUTTON, OK_BUTTON } from '../../pageobjects/BaseDialog';

setTestProperties(__filename, {
    description: 'Keyboard focus moves through the Settings dialog from the selected tab into its content and then '
        + 'to Cancel, OK and Close. Close is shown top-right but is the last stop on purpose, so the whole order is '
        + 'checked and a change at either end would show up.',
    usesBrowsers: [ 'p1' ]
});

describe('Settings dialog focus order', () => {
    it('joining the meeting', () => ensureOneParticipant());

    it('starts at the selected tab and ends with Cancel, OK and Close', async () => {
        const { p1 } = ctx;

        // The expected order holds for the desktop layout only. Below 608px the dialog switches to its mobile layout,
        // where Close and Back come before the content, and only headless Chrome gets a fixed window size.
        await p1.driver.setWindowSize(1280, 1024);

        await p1.getToolbar().clickSettingsButton();

        const settings = p1.getSettingsDialog();

        await settings.waitForDisplay();

        const order = await settings.getFocusOrder();
        const [ firstStop, secondStop ] = order;

        // The first stop is the selected tab and the next one is inside its panel, which is what the tabs pattern
        // promises. Everything after that up to the footer is tab content.
        expect(firstStop.name).toMatch(/^dialogtab-button-/);
        expect(firstStop.selected).toBe(true);
        expect(secondStop.inTabPanel).toBe(true);
        expect(order.slice(-3).map(stop => stop.name)).toEqual([ CANCEL_BUTTON, OK_BUTTON, CLOSE_BUTTON ]);

        await settings.clickCloseButton();
    });
});
