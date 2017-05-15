import { ReducerRegistry } from '../redux';

import {
    LIB_DID_DISPOSE,
    LIB_DID_INIT,
    LIB_INIT_ERROR,
    SET_WEBRTC_READY
} from './actionTypes';

/**
 * The initial state of the feature base/lib-jitsi-meet.
 *
 * @type {Object}
 */
const INITIAL_STATE = {};

ReducerRegistry.register(
    'features/base/lib-jitsi-meet',
    (state = INITIAL_STATE, action) => {
        switch (action.type) {
        case LIB_DID_DISPOSE:
            return INITIAL_STATE;

        case LIB_DID_INIT:
            return {
                ...state,
                initError: undefined,
                initialized: true
            };

        case LIB_INIT_ERROR:
            return {
                ...state,
                initError: action.error,
                initialized: false
            };

        case SET_WEBRTC_READY:
            return {
                ...state,
                webRTCReady: action.webRTCReady
            };

        default:
            return state;
        }
    });
