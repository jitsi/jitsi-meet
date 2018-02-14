// @flow

import { equals, set, ReducerRegistry } from '../redux';

import { SET_CALLEE_INFO_VISIBLE, SET_JWT } from './actionTypes';

/**
 * The default/initial redux state of the feature jwt.
 *
 * @private
 * @type {{
 *     calleeInfoVisible: ?boolean
 *     isGuest: boolean
 * }}
 */
const DEFAULT_STATE = {
    /**
     * The indicator which determines whether (the) {@code CalleeInfo} is
     * visible.
     *
     * @type {boolean|undefined}
     */
    calleeInfoVisible: undefined,

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
ReducerRegistry.register(
    'features/base/jwt',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case SET_CALLEE_INFO_VISIBLE:
            return set(state, 'calleeInfoVisible', action.calleeInfoVisible);

        case SET_JWT: {
            // eslint-disable-next-line no-unused-vars
            const { type, ...payload } = action;
            const nextState = {
                ...DEFAULT_STATE,
                ...payload
            };

            return equals(state, nextState) ? state : nextState;
        }
        }

        return state;
    });
