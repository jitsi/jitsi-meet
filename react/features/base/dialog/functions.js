/* @flow */

import { ColorSchemeRegistry } from '../color-scheme';
import { toState } from '../redux';

/**
 * Checks if any {@code Dialog} is currently open.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {boolean}
 */
export function isAnyDialogOpen(stateful: Function) {
    return Boolean(toState(stateful)['features/base/dialog'].component);
}

/**
 * Checks if a {@code Dialog} with a specific {@code component} is currently
 * open.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @param {React.Component} component - The {@code component} of a
 * {@code Dialog} to be checked.
 * @returns {boolean}
 */
export function isDialogOpen(stateful: Function | Object, component: Object) {
    return toState(stateful)['features/base/dialog'].component === component;
}

/**
 * Maps part of the Redux state to the props of any Dialog based component.
 *
 * @param {Object} state - The Redux state.
 * @returns {{
 *     _dialogStyles: StyleType
 * }}
 */
export function _abstractMapStateToProps(state: Object): Object {
    return {
        _dialogStyles: ColorSchemeRegistry.get(state, 'Dialog')
    };
}
