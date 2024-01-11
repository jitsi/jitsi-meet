import { batch } from 'react-redux';

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
    hidePendingTranscribingNotification,
    potentialTranscriberJoined,
    showPendingTranscribingNotification,
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
        const state = getState();
        const { transcription } = state['features/base/config'];
        const { _requestingSubtitles } = state['features/subtitles'];

        if (!_requestingSubtitles && !transcription?.disableStartForAll) {
            dispatch(toggleRequestingSubtitles());
        }
        break;
    }
    case _TRANSCRIBER_LEFT: {
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
            batch(() => {
                dispatch(transcriberJoined(participant.id));
                dispatch(hidePendingTranscribingNotification());
            });
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
