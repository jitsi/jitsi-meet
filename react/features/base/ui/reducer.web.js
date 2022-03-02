import { ReducerRegistry } from '../redux';

import { SET_DIRECTION } from './actionTypes';

/**
 * The base/ui feature's reducer.
 *
 * @param {Object} state - The Redux state of the feature features/base/ui.
 * @param {Object} action - Action object.
 * @returns {Object}
 */
ReducerRegistry.register(
    'features/base/ui',
    (state = {}, action) => {
        switch (action.type) {
        case SET_DIRECTION: {

            return {
                ...state,
                direction: action.direction
            };
        }

        default:
            return state;
        }
    });
