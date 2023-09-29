import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    REMOVE_TRANSCRIPT_MESSAGE,
    SET_REQUESTING_SUBTITLES, UPDATE_TRANSCRIPT_MESSAGE, UPDATE_TRANSLATION_LANGUAGE
} from './actionTypes';

/**
 * Default State for 'features/transcription' feature.
 */
const defaultState = {
    _transcriptMessages: new Map(),
    _requestingSubtitles: false,
    _language: 'transcribing.subtitlesOff'
};

interface ITranscriptMessage {
    final: string;
    participantName: string;
    stable: string;
    unstable: string;
}

export interface ISubtitlesState {
    _language: string;
    _requestingSubtitles: boolean;
    _transcriptMessages: Map<string, ITranscriptMessage> | any;
}

/**
 * Listen for actions for the transcription feature to be used by the actions
 * to update the rendered transcription subtitles.
 */
ReducerRegistry.register<ISubtitlesState>('features/subtitles', (
        state = defaultState, action): ISubtitlesState => {
    switch (action.type) {
    case REMOVE_TRANSCRIPT_MESSAGE:
        return _removeTranscriptMessage(state, action);
    case UPDATE_TRANSCRIPT_MESSAGE:
        return _updateTranscriptMessage(state, action);
    case UPDATE_TRANSLATION_LANGUAGE:
        return {
            ...state,
            _language: action.value
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
function _removeTranscriptMessage(state: ISubtitlesState, { transcriptMessageID }: { transcriptMessageID: string; }) {
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
function _updateTranscriptMessage(state: ISubtitlesState, { transcriptMessageID, newTranscriptMessage }:
    { newTranscriptMessage: ITranscriptMessage; transcriptMessageID: string; }) {
    const newTranscriptMessages = new Map(state._transcriptMessages);

    // Updates the new message for the given key in the Map.
    newTranscriptMessages.set(transcriptMessageID, newTranscriptMessage);

    return {
        ...state,
        _transcriptMessages: newTranscriptMessages
    };
}
