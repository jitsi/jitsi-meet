/* @flow */

import { toState } from '../redux';

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
