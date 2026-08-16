import { IStore } from '../app/types';
import { JitsiRecordingConstants } from '../base/lib-jitsi-meet';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { isLiveStreamingRunning, isRecordingRunning } from '../recording/functions';
import { maybeNotifyRecordingStart, maybeNotifyRecordingStop } from '../recording/middleware';

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
            // Coordinate the start sound/notification with any concurrent recording start.
            maybeNotifyRecordingStart(dispatch, getState);
        } else {
            // Coordinate the stop sound/notification with any concurrent recording stop.
            maybeNotifyRecordingStop(dispatch, getState);
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
