// @flow

import { ReducerRegistry } from '../base/redux';

import {
    SET_MINIMIZED_ENABLED
} from './actionTypes';

const DEFAULT_STATE = {
    /**
     * The indicator which determines whether the minimized mode is enabled.
     *
     * @public
     * @type {boolean}
     */
    enabled: true
};

ReducerRegistry.register(
    'features/minimized',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case SET_MINIMIZED_ENABLED:
            return {
                ...state,
                enabled: action.enabled
            };
        }

        return state;
    });
