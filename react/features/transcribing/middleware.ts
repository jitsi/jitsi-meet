import { batch } from 'react-redux';

import {
    HIDDEN_PARTICIPANT_JOINED,
    HIDDEN_PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED
} from '../base/participants/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { toggleRequestingSubtitles } from '../subtitles/actions.any';

import {
    _TRANSCRIBER_JOINED,
    _TRANSCRIBER_LEFT
} from './actionTypes';
import {
    hidePendingTranscribingNotification,
    potentialTranscriberJoined,
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
MiddlewareRegistry.register(store => next => action => {
    const {
        transcriberJID,
        potentialTranscriberJIDs
    } = store.getState()['features/transcribing'];

    switch (action.type) {
    case _TRANSCRIBER_LEFT: {
        store.dispatch(showStoppedTranscribingNotification());
        const state = store.getState();
        const { transcription } = state['features/base/config'];
        const { _requestingSubtitles } = state['features/subtitles'];

        if (_requestingSubtitles && !transcription?.disableStartForAll) {
            store.dispatch(toggleRequestingSubtitles());
        }
        break;
    }
    case HIDDEN_PARTICIPANT_JOINED:
        if (action.displayName
                && action.displayName === TRANSCRIBER_DISPLAY_NAME) {
            store.dispatch(transcriberJoined(action.id));
        } else {
            store.dispatch(potentialTranscriberJoined(action.id));
        }

        break;
    case HIDDEN_PARTICIPANT_LEFT:
        if (action.id === transcriberJID) {
            store.dispatch(transcriberLeft(action.id));
        }
        break;
    case PARTICIPANT_UPDATED: {
        const { participant } = action;

        if (potentialTranscriberJIDs.includes(participant.id)
            && participant.name === TRANSCRIBER_DISPLAY_NAME) {
            batch(() => {
                store.dispatch(transcriberJoined(participant.id));
                store.dispatch(hidePendingTranscribingNotification());
            });
        }

        break;
    }
    case _TRANSCRIBER_JOINED: {
        const state = store.getState();
        const { transcription } = state['features/base/config'];
        const { _requestingSubtitles } = state['features/subtitles'];

        if (!_requestingSubtitles && !transcription?.disableStartForAll) {
            store.dispatch(toggleRequestingSubtitles());
        }
        break;
    }
    }

    return next(action);
});
