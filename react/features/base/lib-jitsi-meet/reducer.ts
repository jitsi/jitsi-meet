import ReducerRegistry from '../redux/ReducerRegistry';

import {
    LIB_DID_DISPOSE,
    LIB_DID_INIT,
    LIB_INIT_ERROR
} from './actionTypes';

/**
 * The default/initial redux state of the feature base/lib-jitsi-meet.
 *
 * @type {Object}
 */
const DEFAULT_STATE = {};

export interface ILibJitsiMeetState {
    initError?: Error;
    initialized?: boolean;
}

ReducerRegistry.register<ILibJitsiMeetState>(
    'features/base/lib-jitsi-meet',
    (state = DEFAULT_STATE, action): ILibJitsiMeetState => {
        switch (action.type) {
        case LIB_DID_DISPOSE:
            return DEFAULT_STATE;

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

        default:
            return state;
        }
    });
