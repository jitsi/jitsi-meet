import React from 'react';

import { IStore } from '../app/types';
import { openDialog } from '../base/dialog/actions';
import JitsiMeetJS from '../base/lib-jitsi-meet';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { showStartRecordingNotificationWithCallback } from './actions.any';
import { StartRecordingDialog } from './components/Recording';
import RecordingLimitNotificationDescription from './components/web/RecordingLimitNotificationDescription';

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
 * Displays the notification suggesting to start the recording.
 *
 * @returns {void}
 */
export function showStartRecordingNotification() {
    return (dispatch: IStore['dispatch']) => {
        const openDialogCallback = () => dispatch(openDialog(StartRecordingDialog));

        dispatch(showStartRecordingNotificationWithCallback(openDialogCallback));
    };
}
