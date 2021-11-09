// @flow

import { toState } from '../base/redux';

export * from './functions.any';


/**
 *
 * Returns true if polls feature is disabled.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/config.
 * @returns {boolean}.
 */
export function getDisablePolls(stateful: Object) {
    const state = toState(stateful)['features/base/config'];

    return state.disablePolls;
}

