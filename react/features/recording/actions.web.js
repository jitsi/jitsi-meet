// @flow

import React from 'react';

import JitsiMeetJS from '../base/lib-jitsi-meet';
import { showNotification } from '../notifications';

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
    }, 10000);
}
