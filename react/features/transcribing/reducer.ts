import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    SET_PENDING_TRANSCRIBING_NOTIFICATION_UID,
    _POTENTIAL_TRANSCRIBER_JOINED,
    _TRANSCRIBER_JOINED,
    _TRANSCRIBER_LEFT
} from './actionTypes';

/**
 * Returns initial state for transcribing feature part of Redux store.
 *
 * @returns {{
 * isTranscribing: boolean,
 * isDialing: boolean,
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
         * Indicates whether the transcriber has been dialed into the room and
         * we're currently awaiting successful joining or failure of joining.
         *
         * @type {boolean}
         */
        isDialing: false,

        /**
         * Indicates whether the transcribing feature is in the process of
         * terminating; the transcriber has been told to leave.
         */
        isTerminating: false,

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
    isDialing: boolean;
    isTerminating: boolean;
    isTranscribing: boolean;
    pendingNotificationUid?: string;
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
                isDialing: false,
                transcriberJID: action.transcriberJID
            };
        case _TRANSCRIBER_LEFT:
            return {
                ...state,
                isTerminating: false,
                isTranscribing: false,
                transcriberJID: undefined,
                potentialTranscriberJIDs: []
            };
        case _POTENTIAL_TRANSCRIBER_JOINED:
            return {
                ...state,
                potentialTranscriberJIDs:
                    [ action.transcriberJID ]
                        .concat(state.potentialTranscriberJIDs)
            };
        case SET_PENDING_TRANSCRIBING_NOTIFICATION_UID:
            return {
                ...state,
                pendingNotificationUid: action.uid
            };
        default:
            return state;
        }
    });
