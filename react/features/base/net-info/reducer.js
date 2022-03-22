// @flow
import { assign, ReducerRegistry } from '../redux';

import { SET_NETWORK_INFO, _STORE_NETWORK_INFO_CLEANUP } from './actionTypes';
import { STORE_NAME } from './constants';

const DEFAULT_STATE = {
    isOnline: true
};

/**
 * The base/net-info feature's reducer.
 */
ReducerRegistry.register(STORE_NAME, (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case SET_NETWORK_INFO:
        return assign(state, {
            isOnline: action.isOnline,
            networkType: action.networkType,
            cellularGeneration: action.cellularGeneration,
            details: action.details
        });
    case _STORE_NETWORK_INFO_CLEANUP:
        return assign(state, {
            _cleanup: action.cleanup
        });
    default:
        return state;
    }
});
