// @flow

import { getAppProp } from '../app';
import { toState } from '../redux';

/**
 * Gets the value of a specific feature flag.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @param {string} flag - The name of the React {@code Component} prop of
 * the currently mounted {@code App} to get.
 * @param {*} defaultValue - A default value for the flag, in case it's not defined.
 * @returns {*} The value of the specified React {@code Component} prop of the
 * currently mounted {@code App}.
 */
export function getFeatureFlag(stateful: Function | Object, flag: string, defaultValue: any) {
    const state = toState(stateful)['features/base/flags'];

    if (state) {
        const value = state[flag];

        if (typeof value !== 'undefined') {
            return value;
        }
    }

    // Maybe the value hasn't made it to the redux store yet, check the app props.
    const flags = getAppProp(stateful, 'flags') || {};

    return flags[flag] || defaultValue;
}
