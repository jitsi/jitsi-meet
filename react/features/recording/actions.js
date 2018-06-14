// @flow

import {
    hideNotification,
    showErrorNotification,
    showNotification
} from '../notifications';

import {
    CLEAR_RECORDING_SESSIONS,
    RECORDING_SESSION_UPDATED,
    SET_PENDING_RECORDING_NOTIFICATION_UID
} from './actionTypes';

/**
 * Clears the data of every recording sessions.
 *
 * @returns {{
 *     type: CLEAR_RECORDING_SESSIONS
 * }}
 */
export function clearRecordingSessions() {
    return {
        type: CLEAR_RECORDING_SESSIONS
    };
}

/**
 * Signals that the pending recording notification should be removed from the
 * screen.
 *
 * @returns {Function}
 */
export function hidePendingRecordingNotification() {
    return (dispatch: Function, getState: Function) => {
        const { pendingNotificationUid } = getState()['features/recording'];

        if (pendingNotificationUid) {
            dispatch(hideNotification(pendingNotificationUid));
            dispatch(setPendingRecordingNotificationUid());
        }
    };
}

/**
 * Sets UID of the the pending recording notification to use it when hinding
 * the notification is necessary, or unsets it when
 * undefined (or no param) is passed.
 *
 * @param {?number} uid - The UID of the notification.
 * redux.
 * @returns {{
 *     type: SET_PENDING_RECORDING_NOTIFICATION_UID,
 *     uid: number
 * }}
 */
export function setPendingRecordingNotificationUid(uid: ?number) {
    return {
        type: SET_PENDING_RECORDING_NOTIFICATION_UID,
        uid
    };
}

/**
 * Signals that the pending recording notification should be shown on the
 * screen.
 *
 * @returns {Function}
 */
export function showPendingRecordingNotification() {
    return (dispatch: Function) => {
        const showNotificationAction = showNotification({
            descriptionKey: 'recording.pending',
            isDismissAllowed: false,
            titleKey: 'dialog.recording'
        });

        dispatch(showNotificationAction);

        dispatch(setPendingRecordingNotificationUid(
            showNotificationAction.uid));
    };
}

/**
 * Signals that the recording error notification should be shown.
 *
 * @param {Object} props - The Props needed to render the notification.
 * @returns {showErrorNotification}
 */
export function showRecordingError(props: Object) {
    return showErrorNotification(props);
}

/**
 * Signals that the stopped recording notification should be shown on the
 * screen for a given period.
 *
 * @returns {showNotification}
 */
export function showStoppedRecordingNotification() {
    return showNotification({
        descriptionKey: 'recording.off',
        titleKey: 'dialog.recording'
    }, 2500);
}

/**
 * Updates the known state for a given recording session.
 *
 * @param {Object} session - The new state to merge with the existing state in
 * redux.
 * @returns {{
 *     type: RECORDING_SESSION_UPDATED,
 *     sessionData: Object
 * }}
 */
export function updateRecordingSessionData(session: Object) {
    return {
        type: RECORDING_SESSION_UPDATED,
        sessionData: {
            error: session.getError(),
            id: session.getID(),
            liveStreamViewURL: session.getLiveStreamViewURL(),
            mode: session.getMode(),
            status: session.getStatus()
        }
    };
}
