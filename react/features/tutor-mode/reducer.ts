import { PARTICIPANT_LEFT } from '../base/participants/actionTypes';
import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    CLEAR_TUTOR_MODE_STATE,
    SET_TUTOR_MODE_ERROR,
    SET_TUTOR_MODE_LISTEN_TARGETS,
    SET_TUTOR_MODE_PENDING
} from './actionTypes';

/**
 * The redux state of the tutor-mode feature.
 *
 * The authoritative enabled state lives in the room metadata (see
 * {@code features/base/conference}); this slice holds only local UI state and
 * the tutor's own playback preference.
 */
export interface ITutorModeState {

    /**
     * A translation key describing the last failed tutor-mode request, or null.
     */
    error: string | null;

    /**
     * Participant ids whose audio the tutor wants to hear. Null or empty means
     * everyone. This is a local playback filter only and carries no security
     * meaning.
     */
    listenTo: string[] | null;

    /**
     * Whether a metadata request is waiting for the server to confirm it.
     */
    pending: boolean;
}

const DEFAULT_STATE: ITutorModeState = {
    error: null,
    listenTo: null,
    pending: false
};

ReducerRegistry.register<ITutorModeState>(
    'features/tutor-mode',
    (state = DEFAULT_STATE, action): ITutorModeState => {
        switch (action.type) {
        case CLEAR_TUTOR_MODE_STATE:
            return DEFAULT_STATE;
        case SET_TUTOR_MODE_ERROR:
            return {
                ...state,
                error: action.error
            };
        case SET_TUTOR_MODE_LISTEN_TARGETS:
            return {
                ...state,
                listenTo: action.targets
            };
        case SET_TUTOR_MODE_PENDING:
            return {
                ...state,
                pending: action.pending
            };
        case PARTICIPANT_LEFT: {
            const id = action.participant?.id;

            if (!id || !state.listenTo?.includes(id)) {
                return state;
            }

            return {
                ...state,
                listenTo: state.listenTo.filter(target => target !== id)
            };
        }
        default:
            return state;
        }
    });
