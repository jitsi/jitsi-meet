import React from 'react';
import { batch } from 'react-redux';

import { IStore } from '../app/types';
import { hideDialog, openDialog } from '../base/dialog/actions';
import JitsiMeetJS from '../base/lib-jitsi-meet';
import {
    setAudioMuted,
    setAudioUnmutePermissions,
    setVideoMuted,
    setVideoUnmutePermissions
} from '../base/media/actions';
import { VIDEO_MUTISM_AUTHORITY } from '../base/media/constants';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { showStartRecordingNotificationWithCallback } from './actions.any';
import { StartRecordingDialog } from './components/Recording';
import RecordingLimitNotificationDescription from './components/web/RecordingLimitNotificationDescription';

export * from './actions.any';

/**
 * Grants recording consent by setting audio and video unmute permissions.
 *
 * @returns {Function}
 */
export function grantRecordingConsent() {
    return (dispatch: IStore['dispatch']) => {
        batch(() => {
            dispatch(setAudioUnmutePermissions(false, true));
            dispatch(setVideoUnmutePermissions(false, true));
            dispatch(hideDialog());
        });
    };
}

/**
 * Grants recording consent, unmutes audio/video, and closes the dialog.
 *
 * @returns {Function}
 */
export function grantRecordingConsentAndUnmute() {
    return (dispatch: IStore['dispatch']) => {
        batch(() => {
            dispatch(setAudioUnmutePermissions(false, true));
            dispatch(setVideoUnmutePermissions(false, true));
            dispatch(setAudioMuted(false, true));
            dispatch(setVideoMuted(false, VIDEO_MUTISM_AUTHORITY.USER, true));
            dispatch(hideDialog());
        });
    };
}

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
