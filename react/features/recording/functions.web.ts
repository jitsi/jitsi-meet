export * from './functions.any';

import { IStore } from '../app/types';
import { openDialog } from '../base/dialog/actions';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import LocalRecordingManager from './components/Recording/LocalRecordingManager.web';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import StopRecordingDialog from './components/Recording/web/StopRecordingDialog';

/**
 * Checks if the video mute operation needs to be stopped and opens the stop local recording dialog
 * or the localRecordingNoVideo notification.
 *
 * @param {boolean} muted - The new mute state.
 * @param {Function} dispatch - The redux dispatch function.
 * @returns {boolean}
 */
export function maybeStopMuteBecauseOfLocalRecording(muted: boolean, dispatch: IStore['dispatch']) {
    if (LocalRecordingManager.isRecordingLocally() && LocalRecordingManager.selfRecording.on) {
        if (muted && LocalRecordingManager.selfRecording.withVideo) {
            dispatch(openDialog(StopRecordingDialog, { localRecordingVideoStop: true }));

            return true;
        } else if (!muted && !LocalRecordingManager.selfRecording.withVideo) {
            dispatch(showNotification({
                titleKey: 'recording.localRecordingNoVideo',
                descriptionKey: 'recording.localRecordingVideoWarning',
                uid: 'recording.localRecordingNoVideo'
            }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
        }
    }

    return false;
}
