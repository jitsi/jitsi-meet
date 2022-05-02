// @flow

import { openDialog } from '../base/dialog';
import JitsiMeetJS from '../base/lib-jitsi-meet';
import { NOTIFICATION_TIMEOUT_TYPE, showNotification } from '../notifications';

import HighlightDialog from './components/Recording/native/HighlightDialog';

export * from './actions.any';

/**
 * Opens the highlight dialog.
 *
 * @returns {Function}
 */
export function openHighlightDialog() {
    return (dispatch: Function) => {
        dispatch(openDialog(HighlightDialog));
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
    return (dispatch: Function, getState: Function) => {
        const isLiveStreaming = streamType === JitsiMeetJS.constants.recording.mode.STREAM;
        let descriptionKey, titleKey;

        if (isLiveStreaming) {
            descriptionKey = 'liveStreaming.limitNotificationDescriptionNative';
            titleKey = 'dialog.liveStreaming';
        } else {
            descriptionKey = 'recording.limitNotificationDescriptionNative';
            titleKey = 'dialog.recording';
        }

        const { recordingLimit = {} } = getState()['features/base/config'];
        const { limit, appName } = recordingLimit;

        return dispatch(showNotification({
            descriptionArguments: {
                limit,
                app: appName
            },
            descriptionKey,
            titleKey,
            maxLines: 2
        }, NOTIFICATION_TIMEOUT_TYPE.LONG));
    };
}
