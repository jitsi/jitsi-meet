import ReducerRegistry from '../redux/ReducerRegistry';
import { equals } from '../redux/functions';

import { SET_JWT } from './actionTypes';

export interface IJwtState {
    callee?: {
        name: string;
    };
    group?: string;
    jwt?: string;
    server?: string;
    tenant?: string;
    user?: {
        id: string;
        name: string;
    };
}

/**
 * Reduces redux actions which affect the JSON Web Token (JWT) stored in the
 * redux store.
 *
 * @param {Object} state - The current redux state.
 * @param {Object} action - The redux action to reduce.
 * @returns {Object} The next redux state which is the result of reducing the
 * specified {@code action}.
 */
ReducerRegistry.register<IJwtState>(
    'features/base/jwt',
    (state = {}, action): IJwtState => {
        switch (action.type) {
        case SET_JWT: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { type, ...payload } = action;
            const nextState = {
                ...payload
            };

            return equals(state, nextState) ? state : nextState;
        }
        }

        return state;
    });
