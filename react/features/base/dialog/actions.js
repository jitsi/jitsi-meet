/* @flow */

import { HIDE_DIALOG, OPEN_DIALOG } from './actionTypes';
import { isDialogOpen } from './functions';

/**
 * Signals Dialog to close its dialog.
 *
 * @param {Object} [component] - The <tt>Dialog</tt> component to close/hide. If
 * <tt>undefined</tt>, closes/hides <tt>Dialog</tt> regardless of which
 * component it's rendering; otherwise, closes/hides <tt>Dialog</tt> only if
 * it's rendering the specified <tt>component</tt>.
 * @returns {{
 *     type: HIDE_DIALOG,
 *     component: (React.Component | undefined)
 * }}
 */
export function hideDialog(component: ?Object) {
    return {
        type: HIDE_DIALOG,
        component
    };
}

/**
 * Signals Dialog to open dialog.
 *
 * @param {Object} component - The component to display as dialog.
 * @param {Object} [componentProps] - The React <tt>Component</tt> props of the
 * specified <tt>component</tt>.
 * @returns {{
 *     type: OPEN_DIALOG,
 *     component: React.Component,
 *     componentProps: (Object | undefined)
 * }}
 */
export function openDialog(component: Object, componentProps: ?Object) {
    return {
        type: OPEN_DIALOG,
        component,
        componentProps
    };
}

/**
 * Signals Dialog to open a dialog with the specified component if the component
 * is not already open. If it is open, then Dialog is signaled to close its
 * dialog.
 *
 * @param {Object} component - The component to display as dialog.
 * @param {Object} [componentProps] - The React <tt>Component</tt> props of the
 * specified <tt>component</tt>.
 * @returns {Function}
 */
export function toggleDialog(component: Object, componentProps: ?Object) {
    return (dispatch: Dispatch, getState: Function) => {
        if (isDialogOpen(getState, component)) {
            dispatch(hideDialog(component));
        } else {
            dispatch(openDialog(component, componentProps));
        }
    };
}
