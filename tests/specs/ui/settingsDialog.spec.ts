import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';

setTestProperties(__filename, {
    description: 'Keyboard focus moves through the Settings dialog from the selected tab into its content and then '
        + 'to Cancel, OK and Close. Close is shown top-right but is the last stop on purpose, so the whole order is '
        + 'checked and a change at either end would show up.',
    usesBrowsers: [ 'p1' ]
});

const CANCEL_BUTTON = 'modal-dialog-cancel-button';
const CLOSE_BUTTON = 'modal-header-close-button';
const OK_BUTTON = 'modal-dialog-ok-button';

/**
 * Script that names the element that currently has focus. Falls back to the test id and then the tag name, so an
 * element without an id is still a distinct stop in the recorded order.
 */
const ACTIVE_ELEMENT_NAME
    = 'const el = document.activeElement; return el.id || el.getAttribute("data-testid") || el.tagName;';

describe('Settings dialog focus order', () => {
    it('joining the meeting', () => ensureOneParticipant());

    it('ends with Cancel, OK and Close', async () => {
        const { p1 } = ctx;

        await p1.getToolbar().clickSettingsButton();

        const settings = p1.getSettingsDialog();

        await settings.waitForDisplay();

        const order = await collectFocusOrder(p1);

        // The first stop is the selected tab and the next one is inside its panel, which is what the tabs pattern
        // promises. Everything after that up to the footer is tab content.
        expect(order[0]).toMatch(/^dialogtab-button-/);
        expect(order[1]).not.toMatch(/^dialogtab-button-|^modal-/);
        expect(order.slice(-3)).toEqual([ CANCEL_BUTTON, OK_BUTTON, CLOSE_BUTTON ]);

        await settings.clickCloseButton();
    });
});

/**
 * Upper bound on Tab presses. The dialog's focus lock wraps focus around, so the loop normally stops much earlier;
 * the cap only keeps a broken wrap from running forever.
 */
const MAX_TAB_PRESSES = 100;

/**
 * Presses Tab repeatedly and returns the names of the elements that received focus, in order, until focus wraps
 * around to the first stop. The dialog's initial focus is skipped on purpose: it may sit on the dialog container
 * itself, which is not a stop a keyboard user tabs to.
 *
 * @param participant - The participant whose Settings dialog is open.
 * @returns The focus stops in the order they were reached.
 */
async function collectFocusOrder(participant: Participant): Promise<string[]> {
    const order: string[] = [];

    for (let i = 0; i < MAX_TAB_PRESSES; i++) {
        await participant.driver.keys('Tab');

        const name: string = await participant.driver.execute(ACTIVE_ELEMENT_NAME);

        if (order.length && name === order[0]) {
            return order;
        }

        order.push(name);
    }

    throw new Error(`Focus did not wrap around after ${MAX_TAB_PRESSES} Tab presses: ${order.join(' > ')}`);
}
