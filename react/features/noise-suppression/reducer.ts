import PersistenceRegistry from '../base/redux/PersistenceRegistry';
import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    SET_NOISE_SUPPRESSION_ENABLED
} from './actionTypes';

export interface INoiseSuppressionState {
    enabled: boolean;
}

const STORE_NAME = 'features/noise-suppression';

const DEFAULT_STATE = {
    enabled: false
};

/**
 * Reduces the Redux actions of the feature features/noise-suppression.
 */
ReducerRegistry.register<INoiseSuppressionState>(STORE_NAME,
(state = DEFAULT_STATE, action): INoiseSuppressionState => {
    const { enabled } = action;

    PersistenceRegistry.register(STORE_NAME);

    switch (action.type) {
    case SET_NOISE_SUPPRESSION_ENABLED:
        return {
            ...state,
            enabled
        };
    default:
        return state;
    }
});
