// @flow

import React from 'react';

import JitsiMeetJS from '../base/lib-jitsi-meet';
import { NOTIFICATION_TIMEOUT_TYPE, showNotification } from '../notifications';

import { LOCAL_RECORDING_SESSION_UPDATED } from './actionTypes';
import { RecordingLimitNotificationDescription } from './components';

export * from './actions.any';

/**
 * Signals that a started recording notification should be shown on the
 * screen for a given period.
 *
 * @param {string} streamType - The type of the stream ({@code file} or
 * {@code stream}).
 * @returns {showNotification}
 */
export function showRecordingLimitNotification(streamType: string) {
    const isLiveStreaming = streamType === JitsiMeetJS.constants.recording.mode.STREAM;

    return showNotification({
        description: <RecordingLimitNotificationDescription isLiveStreaming = { isLiveStreaming } />,
        titleKey: isLiveStreaming ? 'dialog.liveStreaming' : 'dialog.recording'
    }, NOTIFICATION_TIMEOUT_TYPE.LONG);
}

/**
 * Updates the known state for a given local recording session.
 *
 * @param {boolean}localVideoRecordingHasStarted - State of local recording.
 * @returns {{
 *     type: LOCAL_RECORDING_SESSION_UPDATED,
 * }}
 */
export function updateLocalRecordingData(localVideoRecordingHasStarted: boolean) {
    return {
        type: LOCAL_RECORDING_SESSION_UPDATED,
        localVideoRecordingHasStarted
    };
}

