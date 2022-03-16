/* eslint-disable no-undef */

/**
 * Define security dialog elements.
*/
class SecurityDialog {

    /**
     * Security dialog element.
     *
     * @returns {HTMLElement}
     */
    get SecurityDialogView() {
        return $('.security-dialog');
    }

    /**
     * Lobby switch element.
     *
     * @returns {HTMLElement}
     */
    get LobbySwitch() {
        return $('[aria-label="cross"]');
    }

    /**
     * Lobby enabled element.
     *
     * @returns {HTMLElement}
     */
    get LobbyEnabled() {
        return $('[data-checked="true"]');
    }

    /**
     * Security dialog close button element.
     *
     * @returns {HTMLElement}
     */
    get SecurityDialogCloseButton() {
        return $('#modal-header-close-button');
    }
}

module.exports = new SecurityDialog();
