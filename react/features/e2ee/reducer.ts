import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    SET_MAX_MODE,
    TOGGLE_E2EE
} from './actionTypes';
import { MAX_MODE } from './constants';

const DEFAULT_STATE = {
    enabled: false,
    maxMode: MAX_MODE.DISABLED
};

export interface IE2EEState {
    enabled: boolean;
    maxMode: string;
}

export interface ISas {
    emoji: Array<string>;
}

/**
 * Reduces the Redux actions of the feature features/e2ee.
 */
ReducerRegistry.register<IE2EEState>('features/e2ee', (state = DEFAULT_STATE, action): IE2EEState => {
    switch (action.type) {
    case TOGGLE_E2EE:
        return {
            ...state,
            enabled: action.enabled
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
