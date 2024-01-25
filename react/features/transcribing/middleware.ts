import { batch } from 'react-redux';

import { IStore } from '../app/types';
import { JitsiRecordingConstants } from '../base/lib-jitsi-meet';
import {
    HIDDEN_PARTICIPANT_JOINED,
    HIDDEN_PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED
} from '../base/participants/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { playSound } from '../base/sounds/actions';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';
import {
    RECORDING_OFF_SOUND_ID,
    RECORDING_ON_SOUND_ID
} from '../recording/constants';

import {
    _TRANSCRIBER_JOINED,
    _TRANSCRIBER_LEFT
} from './actionTypes';
import {
    potentialTranscriberJoined,
    transcriberJoined,
    transcriberLeft
} from './actions';

const TRANSCRIBER_DISPLAY_NAME = 'Transcriber';

/**
 * Implements the middleware of the feature transcribing.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const {
        transcriberJID,
        potentialTranscriberJIDs
    } = getState()['features/transcribing'];

    switch (action.type) {
    case _TRANSCRIBER_JOINED:
        notifyTranscribingStatusChanged(true);
        maybeEmitRecordingNotification(dispatch, getState, true);

        break;
    case _TRANSCRIBER_LEFT:
        notifyTranscribingStatusChanged(false);
        maybeEmitRecordingNotification(dispatch, getState, false);

        break;
    case HIDDEN_PARTICIPANT_JOINED:
        if (action.displayName === TRANSCRIBER_DISPLAY_NAME) {
            dispatch(transcriberJoined(action.id));
        } else {
            dispatch(potentialTranscriberJoined(action.id));
        }

        break;
    case HIDDEN_PARTICIPANT_LEFT:
        if (action.id === transcriberJID) {
            dispatch(transcriberLeft(action.id));
        }
        break;
    case PARTICIPANT_UPDATED: {
        const { participant } = action;

        if (potentialTranscriberJIDs.includes(participant.id) && participant.name === TRANSCRIBER_DISPLAY_NAME) {
            dispatch(transcriberJoined(participant.id));
        }

        break;
    }

    }

    return next(action);
});

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
    const { status: statusConstants } = JitsiRecordingConstants;

    if (sessionDatas.some(sd => sd.mode !== statusConstants.OFF)) {
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
