import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    _POTENTIAL_TRANSCRIBER_JOINED,
    _TRANSCRIBER_JOINED,
    _TRANSCRIBER_LEFT
} from './actionTypes';

/**
 * Returns initial state for transcribing feature part of Redux store.
 *
 * @returns {{
 * isTranscribing: boolean,
 * transcriberJID: null,
 * potentialTranscriberJIDs: Array
 * }}
 * @private
 */
function _getInitialState() {
    return {
        /**
         * Indicates whether there is currently an active transcriber in the
         * room.
         *
         * @type {boolean}
         */
        isTranscribing: false,

        /**
         * The JID of the active transcriber.
         *
         * @type { string }
         */
        transcriberJID: null,

        /**
         * A list containing potential JID's of transcriber participants.
         *
         * @type { Array }
         */
        potentialTranscriberJIDs: []
    };
}

export interface ITranscribingState {
    isTranscribing: boolean;
    potentialTranscriberJIDs: string[];
    transcriberJID?: string | null;
}

/**
 * Reduces the Redux actions of the feature features/transcribing.
 */
ReducerRegistry.register<ITranscribingState>('features/transcribing',
    (state = _getInitialState(), action): ITranscribingState => {
        switch (action.type) {
        case _TRANSCRIBER_JOINED:
            return {
                ...state,
                isTranscribing: true,
                transcriberJID: action.transcriberJID
            };
        case _TRANSCRIBER_LEFT:
            return {
                ...state,
                isTranscribing: false,
                transcriberJID: undefined,
                potentialTranscriberJIDs: []
            };
        case _POTENTIAL_TRANSCRIBER_JOINED:
            return {
                ...state,
                potentialTranscriberJIDs: [ action.transcriberJID, ...state.potentialTranscriberJIDs ]
            };
        default:
            return state;
        }
    });
