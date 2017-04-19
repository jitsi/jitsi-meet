import { ReducerRegistry } from '../base/redux';

import { SET_TOKEN_DATA } from './actionTypes';

/**
 * Listen for actions that update the state of token data part of the Redux
 * store.
 *
 * @param {Object} state - Current state.
 * @param {Object} action - Action object.
 * @returns {Object}
 */
ReducerRegistry.register('features/jwt', (state = {}, action) => {
    switch (action.type) {
    case SET_TOKEN_DATA:
        return action.tokenData;
    }

    return state;
});
