// @flow

import { toState } from '../../redux';

/**
 *
 * Returns the client width.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/config.
 * @returns {number}.
 */
export function getClientWidth(stateful: Object) {
    const state = toState(stateful)['features/base/responsive-ui'];

    return state.clientWidth;
}

/**
 *
 * Returns the client height.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/config.
 * @returns {number}.
 */
export function getClientHeight(stateful: Object) {
    const state = toState(stateful)['features/base/responsive-ui'];

    return state.clientHeight;
}
