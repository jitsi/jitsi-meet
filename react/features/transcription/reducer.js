import {
    ENDPOINT_MESSAGE_RECEIVED,
    ADD_TRANSCRIPT_MESSAGE,
    UPDATE_TRANSCRIPT_MESSAGE,
    REMOVE_TRANSCRIPT_MESSAGE
} from './actionTypes';
import { getUpdatedTranscriptionParagraphs } from './functions';
import { ReducerRegistry } from '../base/redux';

/**
 * Default State for 'features/transcription' feature
 */
const defaultState = {
    transcriptMessages: {},
    transcriptionSubtitles: []
};

/**
 * Listen for actions for the transcription feature to be used by the actions
 * to update the rendered transcription subtitles.
 */
ReducerRegistry.register('features/transcription', (
        state = defaultState, action) => {

    switch (action.type) {
    case ENDPOINT_MESSAGE_RECEIVED:
        return _endpointMessageReceived(state);

    case ADD_TRANSCRIPT_MESSAGE:
        return _addTranscriptMessage(state, action);

    case UPDATE_TRANSCRIPT_MESSAGE:
        return _updateTranscriptMessage(state, action);

    case REMOVE_TRANSCRIPT_MESSAGE:
        return _removeTranscriptMessage(state, action);
    }

    return state;
});

/**
 * Reduces a specific Redux action ENDPOINT_MESSAGE_RECEIVED of the feature
 * transcription.
 *
 * @param {Object} state - The Redux state of the feature transcription.
 * @returns {Object} The new state of the feature transcription after the
 * reduction of the specified action.
 */
function _endpointMessageReceived(state) {

    return {
        ...state,
        transcriptionSubtitles:
            getUpdatedTranscriptionParagraphs(state.transcriptMessages)
    };
}

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

    return {
        ...state,
        transcriptMessages: {
            ...state.transcriptMessages,
            [transcriptMessageID]: { participantName }
        }
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

    return {
        ...state,
        transcriptMessages: {
            ...state.transcriptMessages,
            [transcriptMessageID]: newTranscriptMessage
        }
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
    const newTranscriptMessages = {
        ...state.transcriptMessages,
        [transcriptMessageID]: undefined
    };

    return {
        ...state,
        transcriptMessages: newTranscriptMessages,
        transcriptionSubtitles:
            getUpdatedTranscriptionParagraphs(newTranscriptMessages)
    };
}
