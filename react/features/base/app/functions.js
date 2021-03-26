// @flow

import { toState } from '../redux';

/**
 * Gets the value of a specific React {@code Component} prop of the currently
 * mounted {@link App}.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @param {string} propName - The name of the React {@code Component} prop of
 * the currently mounted {@code App} to get.
 * @returns {*} The value of the specified React {@code Component} prop of the
 * currently mounted {@code App}.
 */
export function getAppProp(stateful: Function | Object, propName: string) {
    const state = toState(stateful)['features/base/app'];

    if (state) {
        const { app } = state;

        if (app) {
            return app.props[propName];
        }
    }

    return undefined;
}
