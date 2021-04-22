// @flow

declare var APP: Object;

export default {

    /**
     * Show notification that external auth is required (using provided url).
     * @param {string} url - URL to use for external auth.
     * @param {function} callback - callback to invoke when auth popup is closed.
     * @returns auth dialog
     */
    showExternalAuthDialog(url: string, callback: ?Function) {
        const dialog = APP.UI.messageHandler.openCenteredPopup(
            url, 910, 660,

            // On closed
            callback
        );

        if (!dialog) {
            APP.UI.messageHandler.showWarning({
                descriptionKey: 'dialog.popupError',
                titleKey: 'dialog.popupErrorTitle'
            });
        }

        return dialog;
    }
};
