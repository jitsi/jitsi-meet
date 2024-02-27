import { batch } from 'react-redux';

import { IStore } from '../app/types';
import { JitsiRecordingConstants } from '../base/lib-jitsi-meet';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { playSound } from '../base/sounds/actions';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';
import { RECORDING_OFF_SOUND_ID, RECORDING_ON_SOUND_ID } from '../recording/constants';

import { isRecorderTranscriptionsRunning } from './functions';

/**
 * Listens for large video participant ID changes.
 */
StateListenerRegistry.register(
    /* selector */ isRecorderTranscriptionsRunning,
    /* listener */ (isRecorderTranscriptionsRunningValue, { getState, dispatch }) => {
        if (isRecorderTranscriptionsRunningValue) {
            notifyTranscribingStatusChanged(true);
            maybeEmitRecordingNotification(dispatch, getState, true);
        } else {
            notifyTranscribingStatusChanged(false);
            maybeEmitRecordingNotification(dispatch, getState, false);
        }
    }
);

/**
 * Emit a recording started / stopped notification if the transcription started / stopped. Only
 * if there is no recording in progress.
 *
 * @param {Dispatch} dispatch - The Redux dispatch function.
 * @param {Function} getState - The Redux state.
 * @param {boolean} on - Whether the transcription is on or not.
 *
 * @returns {void}
 */
function maybeEmitRecordingNotification(dispatch: IStore['dispatch'], getState: IStore['getState'], on: boolean) {
    const state = getState();
    const { sessionDatas } = state['features/recording'];
    const { mode: modeConstants, status: statusConstants } = JitsiRecordingConstants;

    if (sessionDatas.some(sd => sd.mode === modeConstants.FILE && sd.status === statusConstants.ON)) {
        // If a recording is still ongoing, don't send any notification.
        return;
    }

    batch(() => {
        dispatch(showNotification({
            descriptionKey: on ? 'recording.on' : 'recording.off',
            titleKey: 'dialog.recording'
        }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
        dispatch(playSound(on ? RECORDING_ON_SOUND_ID : RECORDING_OFF_SOUND_ID));
    });
}

/**
 * Notify external application (if API is enabled) that transcribing has started or stopped.
 *
 * @param {boolean} on - True if transcribing is on, false otherwise.
 * @returns {void}
 */
function notifyTranscribingStatusChanged(on: boolean) {
    if (typeof APP !== 'undefined') {
        APP.API.notifyTranscribingStatusChanged(on);
    }
}
