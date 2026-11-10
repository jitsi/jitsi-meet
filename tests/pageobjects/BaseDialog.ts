import BasePageObject from './BasePageObject';

export const CANCEL_BUTTON = 'modal-dialog-cancel-button';
export const CLOSE_BUTTON = 'modal-header-close-button';
export const OK_BUTTON = 'modal-dialog-ok-button';

/**
 * Upper bound on Tab presses in a focus walk. The dialog's focus lock wraps focus around, so a walk normally stops
 * much earlier; the cap only keeps a broken wrap from running forever.
 */
const MAX_TAB_PRESSES = 100;

/**
 * Attribute put on the element where a focus walk started. Several stops can share a name (for example two divs
 * without an id), so the wrap is detected on the element itself rather than on its name.
 */
const FOCUS_WALK_START_ATTRIBUTE = 'data-focus-walk-start';

/**
 * One element that received focus during a focus walk.
 */
export interface IFocusStop {

    /**
     * Whether the element is inside the tab panel that is currently shown.
     */
    inTabPanel: boolean;

    /**
     * The element's id, falling back to its test id and then its tag name, so an element without an id is still a
     * distinct stop in the recorded order.
     */
    name: string;

    /**
     * Whether the element is marked with aria-selected="true", which is how the selected tab is exposed.
     */
    selected: boolean;
}

/**
 * Base class for all dialogs.
 */
export default class BaseDialog extends BasePageObject {
    /**
     *  Clicks on the X (close) button.
     */
    clickCloseButton(): Promise<void> {
        return this.participant.driver.$(`#${CLOSE_BUTTON}`).click();
    }

    /**
     *  Clicks on the ok button.
     */
    clickOkButton(): Promise<void> {
        return this.participant.driver.$(`#${OK_BUTTON}`).click();
    }

    /**
     * Waits for focus to be inside the dialog. The focus lock activates asynchronously after the dialog is
     * displayed and only then moves focus onto the dialog, so a Tab press sent before that starts from the page.
     */
    waitForFocusInside(): Promise<true | void> {
        return this.participant.driver.waitUntil(
            () => this.participant.execute(() => Boolean(document.activeElement?.closest('[role="dialog"]'))),
            { timeoutMsg: 'Focus did not move inside the dialog.' });
    }

    /**
     * Presses Tab repeatedly from the dialog's initial focus and returns the elements that received focus, in order,
     * until focus wraps around to the first stop. The initial focus itself is not recorded: it sits on the dialog
     * container, which is not a stop a keyboard user tabs to.
     *
     * @returns The focus stops in the order they were reached.
     */
    async getFocusOrder(): Promise<IFocusStop[]> {
        await this.waitForFocusInside();

        const order: IFocusStop[] = [];

        for (let i = 0; i < MAX_TAB_PRESSES; i++) {
            await this.participant.driver.keys('Tab');

            const stop = await this.participant.execute((attribute: string, isFirst: boolean) => {
                const el = document.activeElement;

                if (!el) {
                    return undefined;
                }

                if (isFirst) {
                    el.setAttribute(attribute, 'true');
                } else if (el.hasAttribute(attribute)) {
                    el.removeAttribute(attribute);

                    return undefined;
                }

                return {
                    inTabPanel: Boolean(el.closest('[role="tabpanel"]:not(.hide)')),
                    name: el.id || el.getAttribute('data-testid') || el.tagName,
                    selected: el.getAttribute('aria-selected') === 'true'
                };
            }, FOCUS_WALK_START_ATTRIBUTE, order.length === 0);

            if (!stop) {
                return order;
            }

            order.push(stop);
        }

        throw new Error(`Focus did not wrap around after ${MAX_TAB_PRESSES} Tab presses: ${
            order.map(stop => stop.name).join(' > ')}`);
    }
}
