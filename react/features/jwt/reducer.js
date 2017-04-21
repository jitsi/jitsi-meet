import { equals, ReducerRegistry } from '../base/redux';

import { SET_JWT } from './actionTypes';

/**
 * The initial redux state of the feature jwt.
 *
 * @private
 * @type {{
 *     isGuest: boolean
 * }}
 */
const _INITIAL_STATE = {
    /**
     * The indicator which determines whether the local participant is a guest
     * in the conference.
     *
     * @type {boolean}
     */
    isGuest: true
};

/**
 * Reduces redux actions which affect the JSON Web Token (JWT) stored in the
 * redux store.
 *
 * @param {Object} state - The current redux state.
 * @param {Object} action - The redux action to reduce.
 * @returns {Object} The next redux state which is the result of reducing the
 * specified {@code action}.
 */
ReducerRegistry.register('features/jwt', (state = _INITIAL_STATE, action) => {
    switch (action.type) {
    case SET_JWT: {
        // eslint-disable-next-line no-unused-vars
        const { type, ...payload } = action;
        const nextState = {
            ..._INITIAL_STATE,
            ...payload
        };

        return equals(state, nextState) ? state : nextState;
    }
    }

    return state;
});
