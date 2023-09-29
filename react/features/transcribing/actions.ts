import { IStore } from '../app/types';
import { hideNotification, showErrorNotification, showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import {
    SET_PENDING_TRANSCRIBING_NOTIFICATION_UID,
    _POTENTIAL_TRANSCRIBER_JOINED,
    _TRANSCRIBER_JOINED,
    _TRANSCRIBER_LEFT
} from './actionTypes';

/**
 * Notify that the transcriber, with a unique ID, has joined.
 *
 * @param {string} participantId - The participant id of the transcriber.
 * @returns {{
 *     type: _TRANSCRIBER_JOINED,
 *     participantId: string
 * }}
 */
export function transcriberJoined(participantId: string) {
    return {
        type: _TRANSCRIBER_JOINED,
        transcriberJID: participantId
    };
}

/**
 * Notify that the transcriber, with a unique ID, has left.
 *
 * @param {string} participantId - The participant id of the transcriber.
 * @returns {{
 *     type: _TRANSCRIBER_LEFT,
 *     participantId: string
 * }}
 */
export function transcriberLeft(participantId: string) {
    return {
        type: _TRANSCRIBER_LEFT,
        transcriberJID: participantId
    };
}

/**
 * Notify that a potential transcriber, with a unique ID, has joined.
 *
 * @param {string} participantId - The participant id of the transcriber.
 * @returns {{
 *     type: _POTENTIAL_TRANSCRIBER_JOINED,
 *     participantId: string
 * }}
 */
export function potentialTranscriberJoined(participantId: string) {
    return {
        type: _POTENTIAL_TRANSCRIBER_JOINED,
        transcriberJID: participantId
    };
}

/**
 * Signals that the pending transcribing notification should be shown on the
 * screen.
 *
 * @returns {Function}
 */
export function showPendingTranscribingNotification() {
    return async (dispatch: IStore['dispatch']) => {
        const notification = await dispatch(showNotification({
            descriptionKey: 'transcribing.pending',
            titleKey: 'dialog.transcribing'
        }, NOTIFICATION_TIMEOUT_TYPE.LONG));

        if (notification) {
            dispatch(setPendingTranscribingNotificationUid(notification.uid));
        }
    };
}

/**
 * Sets UID of the the pending transcribing notification to use it when hiding
 * the notification is necessary, or unsets it when undefined (or no param) is
 * passed.
 *
 * @param {?number} uid - The UID of the notification.
 * @returns {{
 *     type: SET_PENDING_TRANSCRIBING_NOTIFICATION_UID,
 *     uid: number
 * }}
 */
export function setPendingTranscribingNotificationUid(uid?: string) {
    return {
        type: SET_PENDING_TRANSCRIBING_NOTIFICATION_UID,
        uid
    };
}

/**
 * Signals that the pending transcribing notification should be removed from the
 * screen.
 *
 * @returns {Function}
 */
export function hidePendingTranscribingNotification() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { pendingNotificationUid } = getState()['features/transcribing'];

        if (pendingNotificationUid) {
            dispatch(hideNotification(pendingNotificationUid));
            dispatch(setPendingTranscribingNotificationUid());
        }
    };
}

/**
 * Signals that the stopped transcribing notification should be shown on the
 * screen.
 *
 * @returns {showNotification}
 */
export function showStoppedTranscribingNotification() {
    return showNotification({
        descriptionKey: 'transcribing.off',
        titleKey: 'dialog.transcribing'
    }, NOTIFICATION_TIMEOUT_TYPE.SHORT);
}


/**
 * Signals that the transcribing error notification should be shown.
 *
 * @returns {showErrorNotification}
 */
export function showTranscribingError() {
    return showErrorNotification({
        descriptionKey: 'transcribing.error',
        titleKey: 'transcribing.failedToStart'
    }, NOTIFICATION_TIMEOUT_TYPE.LONG);
}
