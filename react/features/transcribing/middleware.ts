import {
    HIDDEN_PARTICIPANT_JOINED,
    HIDDEN_PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED
} from '../base/participants/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { SET_REQUESTING_SUBTITLES } from '../subtitles/actionTypes';
import { toggleRequestingSubtitles } from '../subtitles/actions.any';

import {
    _TRANSCRIBER_JOINED,
    _TRANSCRIBER_LEFT
} from './actionTypes';
import {
    potentialTranscriberJoined,
    showPendingTranscribingNotification,
    showStartedTranscribingNotification,
    showStoppedTranscribingNotification,
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
        isTranscribing,
        transcriberJID,
        potentialTranscriberJIDs
    } = getState()['features/transcribing'];

    switch (action.type) {
    case _TRANSCRIBER_JOINED: {
        notifyTranscribingStatusChanged(true);
        dispatch(showStartedTranscribingNotification());

        const state = getState();
        const { transcription } = state['features/base/config'];
        const { _requestingSubtitles } = state['features/subtitles'];

        if (!_requestingSubtitles && !transcription?.disableStartForAll) {
            dispatch(toggleRequestingSubtitles());
        }
        break;
    }
    case _TRANSCRIBER_LEFT: {
        notifyTranscribingStatusChanged(false);
        dispatch(showStoppedTranscribingNotification());

        const state = getState();
        const { transcription } = state['features/base/config'];
        const { _requestingSubtitles } = state['features/subtitles'];

        if (_requestingSubtitles && !transcription?.disableStartForAll) {
            dispatch(toggleRequestingSubtitles());
        }
        break;
    }
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
    case SET_REQUESTING_SUBTITLES:
        if (action.enabled && !isTranscribing) {
            dispatch(showPendingTranscribingNotification());
        }

        break;

    }

    return next(action);
});

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
