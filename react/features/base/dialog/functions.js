/* @flow */

import { toState } from '../redux';

/**
 * Checks if a <tt>Dialog</tt> with a specific <tt>component</tt> is currently
 * open.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * <tt>getState</tt> function, or the redux state itself.
 * @param {React.Component} component - The <tt>component</tt> of a
 * <tt>Dialog</tt> to be checked.
 * @returns {boolean}
 */
export function isDialogOpen(stateful: Function | Object, component: Object) {
    return toState(stateful)['features/base/dialog'].component === component;
}
