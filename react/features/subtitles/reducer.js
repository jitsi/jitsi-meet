import { ReducerRegistry } from '../base/redux';

import {
    REMOVE_TRANSCRIPT_MESSAGE, TOGGLE_REQUESTING_SUBTITLES,
    SET_REQUESTING_SUBTITLES, UPDATE_TRANSCRIPT_MESSAGE
} from './actionTypes';

/**
 * Default State for 'features/transcription' feature.
 */
const defaultState = {
    _transcriptMessages: new Map(),
    _requestingSubtitles: false
};

/**
 * Listen for actions for the transcription feature to be used by the actions
 * to update the rendered transcription subtitles.
 */
ReducerRegistry.register('features/subtitles', (
        state = defaultState, action) => {
    switch (action.type) {
    case REMOVE_TRANSCRIPT_MESSAGE:
        return _removeTranscriptMessage(state, action);
    case UPDATE_TRANSCRIPT_MESSAGE:
        return _updateTranscriptMessage(state, action);

    case TOGGLE_REQUESTING_SUBTITLES:
        return {
            ...state,
            _requestingSubtitles: !state._requestingSubtitles
        };
    case SET_REQUESTING_SUBTITLES:
        return {
            ...state,
            _requestingSubtitles: action.enabled
        };
    }

    return state;
});

/**
 * Reduces a specific Redux action REMOVE_TRANSCRIPT_MESSAGE of the feature
 * transcription.
 *
 * @param {Object} state - The Redux state of the feature transcription.
 * @param {Action} action -The Redux action REMOVE_TRANSCRIPT_MESSAGE to reduce.
 * @returns {Object} The new state of the feature transcription after the
 * reduction of the specified action.
 */
function _removeTranscriptMessage(state, { transcriptMessageID }) {
    const newTranscriptMessages = new Map(state._transcriptMessages);

    // Deletes the key from Map once a final message arrives.
    newTranscriptMessages.delete(transcriptMessageID);

    return {
        ...state,
        _transcriptMessages: newTranscriptMessages
    };
}

/**
 * Reduces a specific Redux action UPDATE_TRANSCRIPT_MESSAGE of the feature
 * transcription.
 *
 * @param {Object} state - The Redux state of the feature transcription.
 * @param {Action} action -The Redux action UPDATE_TRANSCRIPT_MESSAGE to reduce.
 * @returns {Object} The new state of the feature transcription after the
 * reduction of the specified action.
 */
function _updateTranscriptMessage(state,
        { transcriptMessageID, newTranscriptMessage }) {
    const newTranscriptMessages = new Map(state._transcriptMessages);

    // Updates the new message for the given key in the Map.
    newTranscriptMessages.set(transcriptMessageID, newTranscriptMessage);

    return {
        ...state,
        _transcriptMessages: newTranscriptMessages
    };
}
