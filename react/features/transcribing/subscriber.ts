import { batch } from 'react-redux';

import { IStore } from '../app/types';
import { isConferenceAudioRecordingOn } from '../base/conference/functions';
import { JitsiRecordingConstants } from '../base/lib-jitsi-meet';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { playSound } from '../base/sounds/actions';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';
import { RECORDING_OFF_SOUND_ID, RECORDING_ON_SOUND_ID } from '../recording/constants';
import { isLiveStreamingRunning, isRecordingRunning } from '../recording/functions';

import { isRecorderTranscriptionsRunning } from './functions';

/**
 * Listens for transcriber status change.
 */
StateListenerRegistry.register(
    /* selector */ isRecorderTranscriptionsRunning,
    /* listener */ (isRecorderTranscriptionsRunningValue, { getState, dispatch }) => {
        if (isRecorderTranscriptionsRunningValue) {
            notifyTranscribingStatusChanged(getState, true);
            maybeEmitRecordingNotification(dispatch, getState, true);
        } else {
            notifyTranscribingStatusChanged(getState, false);
            maybeEmitRecordingNotification(dispatch, getState, false);
        }
    }
);

/**
 * Listens for audio-recording-enabled conference property change.
 */
StateListenerRegistry.register(
    /* selector */ isConferenceAudioRecordingOn,
    /* listener */ (audioRecordingOn, { getState, dispatch }) => {
        maybeEmitRecordingNotification(dispatch, getState, audioRecordingOn);
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
 * @param {Function} getState - The Redux state.
 * @param {boolean} on - True if transcribing is on, false otherwise.
 * @returns {void}
 */
function notifyTranscribingStatusChanged(getState: IStore['getState'], on: boolean) {
    if (typeof APP !== 'undefined') {
        const state = getState();
        const isRecording = isRecordingRunning(state);
        const isStreaming = isLiveStreamingRunning(state);
        const mode = isRecording ? JitsiRecordingConstants.mode.FILE : JitsiRecordingConstants.mode.STREAM;

        APP.API.notifyRecordingStatusChanged(isRecording || isStreaming, mode, undefined, on);
        APP.API.notifyTranscribingStatusChanged(on);
    }
}
