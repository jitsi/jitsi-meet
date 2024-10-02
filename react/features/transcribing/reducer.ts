import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    TRANSCRIBER_JOINED,
    TRANSCRIBER_LEFT
} from './actionTypes';

/**
 * Returns initial state for transcribing feature part of Redux store.
 *
 * @returns {{
 * isTranscribing: boolean,
 * transcriberJID: null
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
        transcriberJID: null
    };
}

export interface ITranscribingState {
    isTranscribing: boolean;
    transcriberJID?: string | null;
}

/**
 * Reduces the Redux actions of the feature features/transcribing.
 */
ReducerRegistry.register<ITranscribingState>('features/transcribing',
    (state = _getInitialState(), action): ITranscribingState => {
        switch (action.type) {
        case TRANSCRIBER_JOINED:
            return {
                ...state,
                isTranscribing: true,
                transcriberJID: action.transcriberJID
            };
        case TRANSCRIBER_LEFT:
            return {
                ...state,
                isTranscribing: false,
                transcriberJID: undefined
            };
        default:
            return state;
        }
    });
