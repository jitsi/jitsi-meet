import { batch } from 'react-redux';

import { IStore } from '../app/types';
import { JitsiRecordingConstants } from '../base/lib-jitsi-meet';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { playSound } from '../base/sounds/actions';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';
import { INotificationProps } from '../notifications/types';
import {
    TRANSCRIPTION_OFF_SOUND_ID,
    TRANSCRIPTION_ON_SOUND_ID
} from '../recording/constants';
import { isLiveStreamingRunning, isRecordingRunning } from '../recording/functions';
import { maybeNotifyRecordingStart } from '../recording/middleware';

import { isRecorderTranscriptionsRunning, isTranscribing } from './functions';

/**
 * Listens for transcriber status change.
 */
StateListenerRegistry.register(
    /* selector */ isRecorderTranscriptionsRunning,
    /* listener */ (isRecorderTranscriptionsRunningValue, { getState, dispatch }, previousValue) => {
        // Only emit notifications on actual changes, not on initial state
        if (previousValue === undefined) {
            return;
        }

        if (isRecorderTranscriptionsRunningValue) {
            // Always go through maybeNotifyRecordingStart which checks metadata for the
            // full intent before deciding what sound/notification to play. This ensures
            // we never play a transcription-only sound when recording was also requested.
            maybeNotifyRecordingStart(dispatch, getState);
        } else {
            maybeEmitRecordingNotification(dispatch, getState, false);
        }
    }
);
StateListenerRegistry.register(
    /* selector */ isTranscribing,
    /* listener */ (isTranscribingValue, { getState }, previousValue) => {
        // Only notify on actual changes, not on initial state
        if (previousValue === undefined) {
            return;
        }

        if (isTranscribingValue) {
            notifyTranscribingStatusChanged(getState, true);
        } else {
            notifyTranscribingStatusChanged(getState, false);
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
    const localIntent = state['features/recording'].startRecordingIntent;
    const metadata = state['features/base/conference'].metadata?.recording;
    const { mode: modeConstants, status: statusConstants } = JitsiRecordingConstants;

    // If a coordinated recording+transcription start is in progress (local or remote), suppress.
    // maybeNotifyRecordingStart will emit the appropriate combined notification instead.
    if (localIntent?.recording || metadata?.isRecordingRequested) {
        return;
    }

    if (sessionDatas.some(sd => sd.mode === modeConstants.FILE
        && (sd.status === statusConstants.ON || sd.status === statusConstants.PENDING))) {
        // If a recording is ongoing or about to start, don't send a transcription-only notification.
        // The recording middleware will emit the appropriate combined notification instead.
        return;
    }

    // When transcription is turning off and a FILE recording recently stopped (status OFF),
    // the recording middleware already played the combined stop sound/notification.
    // Suppress the duplicate transcription-only stop notification.
    if (!on && sessionDatas.some(sd => sd.mode === modeConstants.FILE
        && sd.status === statusConstants.OFF)) {
        return;
    }

    // Show transcription-specific notification when there's no recording
    const notifyProps: INotificationProps = {
        descriptionKey: on ? 'transcribing.on' : 'transcribing.off',
        titleKey: 'dialog.recording'
    };

    batch(() => {
        dispatch(showNotification(notifyProps, NOTIFICATION_TIMEOUT_TYPE.SHORT));
        dispatch(playSound(on ? TRANSCRIPTION_ON_SOUND_ID : TRANSCRIPTION_OFF_SOUND_ID));
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
        const { sessionDatas } = state['features/recording'];
        const { mode: modeConstants, status: statusConstants } = JitsiRecordingConstants;
        const isRecording = isRecordingRunning(state);
        const isStreaming = isLiveStreamingRunning(state);

        // Only call notifyRecordingStatusChanged when there is no active FILE recording
        // session. During recording session transitions (ON/PENDING), the recording
        // middleware already reports the recording + transcription state accurately.
        // This avoids duplicate or contradictory API calls.
        const hasActiveFileSession = sessionDatas.some(sd => sd.mode === modeConstants.FILE
            && (sd.status === statusConstants.ON || sd.status === statusConstants.PENDING));

        if (!hasActiveFileSession) {
            const mode = isRecording ? modeConstants.FILE : modeConstants.STREAM;

            APP.API.notifyRecordingStatusChanged(isRecording || isStreaming, mode, undefined, on);
        }

        APP.API.notifyTranscribingStatusChanged(on);
    }
}
