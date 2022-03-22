// @flow

import { ReducerRegistry } from '../base/redux';

import {
    SET_EVERYONE_ENABLED_E2EE,
    SET_EVERYONE_SUPPORT_E2EE,
    SET_MAX_MODE,
    TOGGLE_E2EE
} from './actionTypes';
import { MAX_MODE } from './constants';

const DEFAULT_STATE = {
    enabled: false,
    maxMode: MAX_MODE.DISABLED
};

/**
 * Reduces the Redux actions of the feature features/e2ee.
 */
ReducerRegistry.register('features/e2ee', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case TOGGLE_E2EE:
        return {
            ...state,
            enabled: action.enabled
        };
    case SET_EVERYONE_ENABLED_E2EE:
        return {
            ...state,
            everyoneEnabledE2EE: action.everyoneEnabledE2EE
        };
    case SET_EVERYONE_SUPPORT_E2EE:
        return {
            ...state,
            everyoneSupportE2EE: action.everyoneSupportE2EE
        };

    case SET_MAX_MODE: {
        return {
            ...state,
            maxMode: action.maxMode
        };
    }

    default:
        return state;
    }
});
