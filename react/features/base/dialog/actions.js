import {
    HIDE_DIALOG,
    OPEN_DIALOG
} from './actionTypes';

/**
 * Signals Dialog to close its dialog.
 *
 * @returns {{
 *     type: HIDE_DIALOG
 * }}
 */
export function hideDialog() {
    return {
        type: HIDE_DIALOG
    };
}

/**
 * Signals Dialog to open dialog.
 *
 * @param {Object} component - The component to display as dialog.
 * @param {Object} componentProps - The properties needed for that component.
 * @returns {Object}
 */
export function openDialog(component, componentProps) {
    return {
        type: OPEN_DIALOG,
        component,
        componentProps
    };
}

/**
 * Signals Dialog to open a dialog with the specified component if the component
 * is not already open. If it is open, then Dialog is signaled to close
 * its dialog.
 *
 * @param {Object} component - The component to display as dialog.
 * @param {Object} componentProps - The properties needed for that component.
 * @returns {Object}
 */
export function toggleDialog(component, componentProps) {
    return (dispatch, getState) => {
        const state = getState();
        const dialogState = state['features/base/dialog'];

        if (dialogState.component === component) {
            dispatch(hideDialog());
        } else {
            dispatch(openDialog(component, componentProps));
        }
    };
}
