/* global APP */

import {
    NOTIFICATION_TIMEOUT,
    showErrorNotification,
    showNotification,
    showWarningNotification
} from '../../../react/features/notifications';

const messageHandler = {
    /**
     * Opens new popup window for given <tt>url</tt> centered over current
     * window.
     *
     * @param url the URL to be displayed in the popup window
     * @param w the width of the popup window
     * @param h the height of the popup window
     * @param onPopupClosed optional callback function called when popup window
     *        has been closed.
     *
     * @returns {object} popup window object if opened successfully or undefined
     *          in case we failed to open it(popup blocked)
     */
    // eslint-disable-next-line max-params
    openCenteredPopup(url, w, h, onPopupClosed) {
        const l = window.screenX + (window.innerWidth / 2) - (w / 2);
        const t = window.screenY + (window.innerHeight / 2) - (h / 2);
        const popup = window.open(
            url, '_blank',
            String(`top=${t}, left=${l}, width=${w}, height=${h}`));

        if (popup && onPopupClosed) {
            const pollTimer = window.setInterval(() => {
                if (popup.closed !== false) {
                    window.clearInterval(pollTimer);
                    onPopupClosed();
                }
            }, 200);
        }

        return popup;
    },

    /**
     * Shows an error dialog to the user.
     *
     * @param {object} props - The properties to pass to the
     * showErrorNotification action.
     */
    showError(props) {
        APP.store.dispatch(showErrorNotification(props));
    },

    /**
     * Shows a warning dialog to the user.
     *
     * @param {object} props - The properties to pass to the
     * showWarningNotification action.
     */
    showWarning(props) {
        APP.store.dispatch(showWarningNotification(props));
    },

    /**
     * Displays a notification about participant action.
     * @param displayName the display name of the participant that is
     * associated with the notification.
     * @param displayNameKey the key from the language file for the display
     * name. Only used if displayName is not provided.
     * @param cls css class for the notification
     * @param messageKey the key from the language file for the text of the
     * message.
     * @param messageArguments object with the arguments for the message.
     * @param optional configurations for the notification (e.g. timeout)
     */
    participantNotification( // eslint-disable-line max-params
            displayName,
            displayNameKey,
            cls,
            messageKey,
            messageArguments,
            timeout = NOTIFICATION_TIMEOUT) {
        APP.store.dispatch(showNotification({
            descriptionArguments: messageArguments,
            descriptionKey: messageKey,
            titleKey: displayNameKey,
            title: displayName
        },
        timeout));
    }
};

export default messageHandler;
