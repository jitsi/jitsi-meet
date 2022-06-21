/* global APP */

import {
    NOTIFICATION_TIMEOUT_TYPE,
    showErrorNotification,
    showWarningNotification
} from '../../../react/features/notifications';

const messageHandler = {
    /**
     * Shows an error dialog to the user.
     *
     * @param {object} props - The properties to pass to the
     * showErrorNotification action.
     */
    showError(props) {
        APP.store.dispatch(showErrorNotification(props, NOTIFICATION_TIMEOUT_TYPE.LONG));
    },

    /**
     * Shows a warning dialog to the user.
     *
     * @param {object} props - The properties to pass to the
     * showWarningNotification action.
     */
    showWarning(props) {
        APP.store.dispatch(showWarningNotification(props, NOTIFICATION_TIMEOUT_TYPE.LONG));
    }
};

export default messageHandler;
