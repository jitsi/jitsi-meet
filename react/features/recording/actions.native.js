// @flow

import JitsiMeetJS from '../base/lib-jitsi-meet';
import { showNotification } from '../notifications';

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
        }, 10000));
    };
}
