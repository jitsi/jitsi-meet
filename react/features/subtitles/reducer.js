import { ReducerRegistry } from '../base/redux';

import {
    ADD_TRANSCRIPT_MESSAGE,
    REMOVE_TRANSCRIPT_MESSAGE,
    UPDATE_TRANSCRIPT_MESSAGE
} from './actionTypes';

/**
 * Default State for 'features/transcription' feature
 */
const defaultState = {
    transcriptMessages: new Map()
};

/**
 * Listen for actions for the transcription feature to be used by the actions
 * to update the rendered transcription subtitles.
 */
ReducerRegistry.register('features/subtitles', (
        state = defaultState, action) => {
    switch (action.type) {
    case ADD_TRANSCRIPT_MESSAGE:
        return _addTranscriptMessage(state, action);

    case REMOVE_TRANSCRIPT_MESSAGE:
        return _removeTranscriptMessage(state, action);

    case UPDATE_TRANSCRIPT_MESSAGE:
        return _updateTranscriptMessage(state, action);
    }

    return state;
});

/**
 * Reduces a specific Redux action ADD_TRANSCRIPT_MESSAGE of the feature
 * transcription.
 *
 * @param {Object} state - The Redux state of the feature transcription.
 * @param {Action} action -The Redux action ADD_TRANSCRIPT_MESSAGE to reduce.
 * @returns {Object} The new state of the feature transcription after the
 * reduction of the specified action.
 */
function _addTranscriptMessage(state,
        { transcriptMessageID, participantName }) {
    const newTranscriptMessages = new Map(state.transcriptMessages);

    // Adds a new key,value pair to the Map once a new message arrives.
    newTranscriptMessages.set(transcriptMessageID, { participantName });

    return {
        ...state,
        transcriptMessages: newTranscriptMessages
    };
}

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
    const newTranscriptMessages = new Map(state.transcriptMessages);

    // Deletes the key from Map once a final message arrives.
    newTranscriptMessages.delete(transcriptMessageID);

    return {
        ...state,
        transcriptMessages: newTranscriptMessages
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
    const newTranscriptMessages = new Map(state.transcriptMessages);

    // Updates the new message for the given key in the Map.
    newTranscriptMessages.set(transcriptMessageID, newTranscriptMessage);

    return {
        ...state,
        transcriptMessages: newTranscriptMessages
    };
}
