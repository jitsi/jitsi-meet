import { showErrorNotification, showNotification } from '../notifications/actions';
import {
    NOTIFICATION_TIMEOUT_TYPE,
    TRANSCRIBING_NOTIFICATION_ID
} from '../notifications/constants';

import {
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
 * @returns {showNotification}
 */
export function showPendingTranscribingNotification() {
    return showNotification({
        descriptionKey: 'transcribing.pending',
        titleKey: 'dialog.transcribing',
        uid: TRANSCRIBING_NOTIFICATION_ID
    }, NOTIFICATION_TIMEOUT_TYPE.LONG);
}

/**
 * Signals that the started transcribing notification should be shown on the
 * screen.
 *
 * @returns {showNotification}
 */
export function showStartedTranscribingNotification() {
    return showNotification({
        descriptionKey: 'transcribing.on',
        titleKey: 'dialog.transcribing',
        uid: TRANSCRIBING_NOTIFICATION_ID
    }, NOTIFICATION_TIMEOUT_TYPE.SHORT);
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
        titleKey: 'dialog.transcribing',
        uid: TRANSCRIBING_NOTIFICATION_ID
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
        titleKey: 'transcribing.failedToStart',
        uid: TRANSCRIBING_NOTIFICATION_ID
    }, NOTIFICATION_TIMEOUT_TYPE.LONG);
}
