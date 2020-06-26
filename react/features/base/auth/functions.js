// @flow

import { toState } from '../redux';

/**
 * Returns the display name of the conference.
 *
 * @param {Function | Object} stateful - Reference that can be resolved to Redux
 * state with the {@code toState} function.
 * @returns {Object}
 */
export function getCurrentUser(stateful: Function | Object): string {
    const state = toState(stateful);
    const { user } = state['features/base/jwt'];

    return user;
}
