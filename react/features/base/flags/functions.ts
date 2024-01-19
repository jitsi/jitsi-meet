import { getAppProp } from '../app/functions';
import { IStateful } from '../app/types';
import { toState } from '../redux/functions';

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
export function getFeatureFlag(stateful: IStateful, flag: string, defaultValue?: boolean | string) {
    const state = toState(stateful)['features/base/flags'];

    if (state) {
        const value = state[flag as keyof typeof state];

        if (typeof value !== 'undefined') {
            return value;
        }
    }

    // Maybe the value hasn't made it to the redux store yet, check the app props.
    const flags = getAppProp(stateful, 'flags') || {};

    return flags[flag] || defaultValue;
}
