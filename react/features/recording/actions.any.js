// @flow

import React from 'react';

import { openDialog } from '../base/dialog';
import JitsiMeetJS, { JitsiRecordingConstants } from '../base/lib-jitsi-meet';
import {
    NOTIFICATION_TIMEOUT,
    NOTIFICATION_TYPE,
    hideNotification,
    showErrorNotification,
    showNotification
} from '../notifications';

import {
    CLEAR_RECORDING_SESSIONS,
    RECORDING_SESSION_UPDATED,
    SET_PENDING_RECORDING_NOTIFICATION_UID,
    SET_STREAM_KEY,
    SET_WAITING_IN_RECORDING_NOTIFICATION_UID
} from './actionTypes';
import { QueueInfo, StopLiveStreamDialog, StopRecordingDialog } from './components';

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
 * @param {string} streamType - The type of the stream ({@code 'file'} or
 * {@code 'stream'}).
 * @returns {Function}
 */
export function hidePendingRecordingNotification(streamType: string) {
    return (dispatch: Function, getState: Function) => {
        const { pendingNotificationUids } = getState()['features/recording'];
        const pendingNotificationUid = pendingNotificationUids[streamType];

        if (pendingNotificationUid) {
            dispatch(hideNotification(pendingNotificationUid));
            dispatch(
                _setPendingRecordingNotificationUid(
                    undefined, streamType));
        }
    };
}

/**
 * Signals that the waiting in queue recording notification should be removed from the screen.
 *
 * @param {string} streamType - The type of the stream ({@code 'file'} or
 * {@code 'stream'}).
 * @returns {Function}
 */
export function hideWaitingInQueueRecordingNotification(streamType: string) {
    return (dispatch: Function, getState: Function) => {
        const { waitingInQueueNotificationUids } = getState()['features/recording'];
        const waitingInQueueNotificationUid = waitingInQueueNotificationUids[streamType];

        if (waitingInQueueNotificationUid) {
            dispatch(hideNotification(waitingInQueueNotificationUid));
            dispatch(_setWaitingInQueueRecordingNotificationUid(undefined, streamType));
        }
    };
}

/**
 * Sets the stream key last used by the user for later reuse.
 *
 * @param {string} streamKey - The stream key to set.
 * @returns {{
 *     type: SET_STREAM_KEY,
 *     streamKey: string
 * }}
 */
export function setLiveStreamKey(streamKey: string) {
    return {
        type: SET_STREAM_KEY,
        streamKey
    };
}

/**
 * Signals that the pending recording notification should be shown on the
 * screen.
 *
 * @param {string} streamType - The type of the stream ({@code file} or
 * {@code stream}).
 * @returns {Function}
 */
export function showPendingRecordingNotification(streamType: string) {
    return (dispatch: Function) => {
        const isLiveStreaming
            = streamType === JitsiMeetJS.constants.recording.mode.STREAM;
        const dialogProps = isLiveStreaming ? {
            descriptionKey: 'liveStreaming.pending',
            titleKey: 'dialog.liveStreaming'
        } : {
            descriptionKey: 'recording.pending',
            titleKey: 'dialog.recording'
        };
        const showNotificationAction = showNotification({
            isDismissAllowed: false,
            ...dialogProps
        });

        dispatch(showNotificationAction);

        dispatch(_setPendingRecordingNotificationUid(
            showNotificationAction.uid, streamType));
    };
}

/**
 * Signals that the jibri queue has been left and notification should be shown on the
 * screen.
 *
 * @param {string} streamType - The type of the stream ({@code file} or
 * {@code stream}).
 * @returns {showNotification}
 */
export function showQueueLeftRecordingNotification(streamType: string) {
    const isLiveStreaming = streamType === JitsiMeetJS.constants.recording.mode.STREAM;

    return showNotification({
        titleKey: `jibriQueue.${isLiveStreaming ? 'livestreaming' : 'recording'}.left`
    }, NOTIFICATION_TIMEOUT);
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
 * @param {string} streamType - The type of the stream ({@code file} or
 * {@code stream}).
 * @param {string?} participantName - The participant name stopping the recording.
 * @returns {showNotification}
 */
export function showStoppedRecordingNotification(streamType: string, participantName?: string) {
    const isLiveStreaming
        = streamType === JitsiMeetJS.constants.recording.mode.STREAM;
    const descriptionArguments = { name: participantName };
    const dialogProps = isLiveStreaming ? {
        descriptionKey: participantName ? 'liveStreaming.offBy' : 'liveStreaming.off',
        descriptionArguments,
        titleKey: 'dialog.liveStreaming'
    } : {
        descriptionKey: participantName ? 'recording.offBy' : 'recording.off',
        descriptionArguments,
        titleKey: 'dialog.recording'
    };

    return showNotification(dialogProps, NOTIFICATION_TIMEOUT);
}

/**
 * Signals that a started recording notification should be shown on the
 * screen for a given period.
 *
 * @param {string} streamType - The type of the stream ({@code file} or
 * {@code stream}).
 * @param {string} participantName - The participant name that started the recording.
 * @returns {showNotification}
 */
export function showStartedRecordingNotification(streamType: string, participantName: string) {
    const isLiveStreaming
        = streamType === JitsiMeetJS.constants.recording.mode.STREAM;
    const descriptionArguments = { name: participantName };
    const dialogProps = isLiveStreaming ? {
        descriptionKey: 'liveStreaming.onBy',
        descriptionArguments,
        titleKey: 'dialog.liveStreaming'
    } : {
        descriptionKey: 'recording.onBy',
        descriptionArguments,
        titleKey: 'dialog.recording'
    };

    return showNotification(dialogProps, NOTIFICATION_TIMEOUT);
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
    const status = session.getStatus();
    const timestamp
        = status === JitsiRecordingConstants.status.ON
            ? Date.now() / 1000
            : undefined;
    const queueID = session.getQueueID();
    let queueEstimatedTimeOfStart, queuePosition;

    if (status === JitsiRecordingConstants.status.WAITING_IN_QUEUE) {
        const { position, estimatedTimeLeft } = session.getQueueMetrics();

        queuePosition = position;
        queueEstimatedTimeOfStart = (new Date()).getTime() + (estimatedTimeLeft * 1000);
    }

    return {
        type: RECORDING_SESSION_UPDATED,
        sessionData: {
            error: session.getError(),
            id: session.getID(),
            initiator: session.getInitiator(),
            liveStreamViewURL: session.getLiveStreamViewURL(),
            mode: session.getMode(),
            status,
            terminator: session.getTerminator(),
            timestamp,
            queueID,
            queuePosition,
            queueEstimatedTimeOfStart
        }
    };
}

/**
 * Sets UID of the the pending streaming notification to use it when hinding
 * the notification is necessary, or unsets it when undefined (or no param) is
 * passed.
 *
 * @param {?number} uid - The UID of the notification.
 * @param {string} streamType - The type of the stream ({@code file} or
 * {@code stream}).
 * @returns {{
 *     type: SET_PENDING_RECORDING_NOTIFICATION_UID,
 *     streamType: string,
 *     uid: number
 * }}
 */
function _setPendingRecordingNotificationUid(uid: ?number, streamType: string) {
    return {
        type: SET_PENDING_RECORDING_NOTIFICATION_UID,
        streamType,
        uid
    };
}

/**
 * Sets UID of the the pending streaming notification to use it when hiding
 * the notification is necessary, or unsets it when undefined (or no param) is
 * passed.
 *
 * @param {?number} uid - The UID of the notification.
 * @param {string} streamType - The type of the stream ({@code file} or {@code stream}).
 * @returns {{
 *     type: SET_PENDING_RECORDING_NOTIFICATION_UID,
 *     streamType: string,
 *     uid: number
 * }}
 */
function _setWaitingInQueueRecordingNotificationUid(uid: ?number, streamType: string) {
    return {
        type: SET_WAITING_IN_RECORDING_NOTIFICATION_UID,
        streamType,
        uid
    };
}

/**
 * Signals that the recording queue notification should be shown on the screen.
 *
 * @param {string} streamType - The type of the stream ({@code file} or
 * {@code stream}).
 * @returns {Function}
 */
export function showWaitingInQueueRecordingNotification(streamType: string) {
    return (dispatch: Function) => {
        const isLiveStreaming = streamType === JitsiMeetJS.constants.recording.mode.STREAM;
        const showNotificationAction = showNotification({
            appearance: NOTIFICATION_TYPE.INFO,
            customActionNameKey: 'jibriQueue.exit',
            customActionHandler: () => {
                if (isLiveStreaming) {
                    dispatch(openDialog(StopLiveStreamDialog));
                } else {
                    dispatch(openDialog(StopRecordingDialog));
                }

                return false;
            },
            position: 'top',
            titleKey: `jibriQueue.${isLiveStreaming ? 'livestreaming' : 'recording'}.title`,
            description: <QueueInfo />
        });

        dispatch(showNotificationAction);
        dispatch(_setWaitingInQueueRecordingNotificationUid(
            showNotificationAction.uid, streamType));
    };
}
