import BasePageObject from './BasePageObject';

const CLOSE_BUTTON = 'modal-header-close-button';
const OK_BUTTON = 'modal-dialog-ok-button';

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
}
