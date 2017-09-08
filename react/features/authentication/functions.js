import {
    LoginDialog,
    WaitForOwnerDialog
} from './components/index';
import { hideDialog } from '../base/dialog/actions';

/**
 * Will clear the wait for conference owner timeout handler if any is currently
 * set.
 *
 * @param {Object} store - The Redux store instance.
 * @returns {void}
 */
export function clearExistingWaitForOwnerTimeout(store) {
    const { waitForOwnerTimeoutID }
        = store.getState()['features/authentication'];

    if (waitForOwnerTimeoutID) {
        clearTimeout(waitForOwnerTimeoutID);
    }
}

/**
 * Checks if {@link LoginDialog} is currently open.
 *
 * @param {Object|Function} getStateOrState - The Redux store instance or
 * store's get state method.
 * @returns {boolean}
 */
export function isLoginDialogOpened(getStateOrState) {
    const state
        = typeof getStateOrState === 'function'
            ? getStateOrState() : getStateOrState;
    const dialogState = state['features/base/dialog'];

    return dialogState.component && dialogState.component === LoginDialog;
}

/**
 * Hides {@link LoginDialog} if it's currently displayed.
 *
 * @param {Object} store - The Redux store instance.
 * @returns {void}
 */
export function hideLoginDialog({ dispatch, getState }) {
    if (isLoginDialogOpened(getState)) {
        dispatch(hideDialog());
    }
}

/**
 * Checks if {@link WaitForOwnerDialog} is currently open.
 *
 * @param {Object} store - The Redux store instance.
 * @returns {boolean}
 */
export function isWaitForOwnerDialogOpened({ getState }) {
    const dialogState = getState()['features/base/dialog'];

    return dialogState.component
        && dialogState.component === WaitForOwnerDialog;
}

/**
 * Checks if the cyclic "wait for conference owner" task is currently scheduled.
 *
 * @param {Object} store - The Redux store instance.
 * @returns {boolean}
 */
export function isWaitingForOwner({ getState }) {
    const { waitForOwnerTimeoutID } = getState()['features/authentication'];

    return Boolean(waitForOwnerTimeoutID);
}
