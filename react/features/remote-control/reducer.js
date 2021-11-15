import { ReducerRegistry, set } from '../base/redux';

import {
    CAPTURE_EVENTS,
    REMOTE_CONTROL_ACTIVE,
    SET_CONTROLLED_PARTICIPANT,
    SET_CONTROLLER,
    SET_RECEIVER_ENABLED,
    SET_RECEIVER_TRANSPORT,
    SET_REQUESTED_PARTICIPANT
} from './actionTypes';

/**
 * The default state.
 */
const DEFAULT_STATE = {
    active: false,
    controller: {
        isCapturingEvents: false
    },
    receiver: {
        enabled: false
    }
};

/**
 * Listen for actions that mutate the remote control state.
 */
ReducerRegistry.register(
    'features/remote-control', (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case CAPTURE_EVENTS:
            return {
                ...state,
                controller: set(state.controller, 'isCapturingEvents', action.isCapturingEvents)
            };
        case REMOTE_CONTROL_ACTIVE:
            return set(state, 'active', action.active);
        case SET_RECEIVER_TRANSPORT:
            return {
                ...state,
                receiver: set(state.receiver, 'transport', action.transport)
            };
        case SET_RECEIVER_ENABLED:
            return {
                ...state,
                receiver: set(state.receiver, 'enabled', action.enabled)
            };
        case SET_REQUESTED_PARTICIPANT:
            return {
                ...state,
                controller: set(state.controller, 'requestedParticipant', action.requestedParticipant)
            };
        case SET_CONTROLLED_PARTICIPANT:
            return {
                ...state,
                controller: set(state.controller, 'controlled', action.controlled)
            };
        case SET_CONTROLLER:
            return {
                ...state,
                receiver: set(state.receiver, 'controller', action.controller)
            };
        }

        return state;
    }
);
