/* eslint-disable no-undef */

/**
 * Define security dialog elements.
*/
class SecurityDialog {

    /**
     * Initializes a new user browser instance.
     *
     * @param {Object} userBrowser - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(userBrowser) {
        this.userBrowser = userBrowser;
    }

    /**
     * Security dialog element.
     *
     * @returns {HTMLElement}
     */
    get SecurityDialogView() {
        return this.userBrowser.$('.security-dialog');
    }

    /**
     * Lobby switch element.
     *
     * @returns {HTMLElement}
     */
    get LobbySwitch() {
        return this.userBrowser.$('[aria-label="cross"]');
    }

    /**
     * Lobby enabled element.
     *
     * @returns {HTMLElement}
     */
    get LobbyEnabled() {
        return this.userBrowser.$('[data-checked="true"]');
    }

    /**
     * Security dialog close button element.
     *
     * @returns {HTMLElement}
     */
    get SecurityDialogCloseButton() {
        return this.userBrowser.$('#modal-header-close-button');
    }
}

module.exports = SecurityDialog;
