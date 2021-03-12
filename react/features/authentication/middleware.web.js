// @flow

import type { Dispatch } from 'redux';

import { appNavigate } from '../app/actions';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT
} from '../base/conference';
import { CONNECTION_ESTABLISHED, CONNECTION_FAILED } from '../base/connection';
import { hideDialog, isDialogOpen } from '../base/dialog';
import {
    JitsiConferenceErrors,
    JitsiConnectionErrors
} from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';

import {
    CANCEL_LOGIN,
    STOP_WAIT_FOR_OWNER,
    WAIT_FOR_OWNER
} from './actionTypes';
import {
    openLoginDialog,
    openWaitForOwnerDialog,
    stopWaitForOwner,
    waitForOwner
} from './actions.web';
import { LoginDialog, WaitForOwnerDialog } from './components/web';

/**
 * Middleware that captures connection or conference failed errors and controls
 * {@link WaitForOwnerDialog} and {@link LoginDialog}.
 *
 * FIXME Some of the complexity was introduced by the lack of dialog stacking.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {

    case CONFERENCE_FAILED: {
        const { error } = action;
        let recoverable;

        if (error.name === JitsiConferenceErrors.AUTHENTICATION_REQUIRED) {
            if (typeof error.recoverable === 'undefined') {
                error.recoverable = true;
            }
            recoverable = error.recoverable;
        }
        if (recoverable) {
            store.dispatch(waitForOwner());
        } else {
            store.dispatch(stopWaitForOwner());
        }
        break;
    }

    case WAIT_FOR_OWNER: {
        clearExistingWaitForOwnerTimeout(store);

        const { handler, timeoutMs } = action;

        action.waitForOwnerTimeoutID = setTimeout(handler, timeoutMs);

        isDialogOpen(store, LoginDialog)
            || store.dispatch(openWaitForOwnerDialog());
        break;
    }
    case STOP_WAIT_FOR_OWNER:
        clearExistingWaitForOwnerTimeout(store);
        store.dispatch(hideDialog(WaitForOwnerDialog));
        break;

    case CANCEL_LOGIN: {
        // Checks if WaitForOwnerDialog is open
        if (!isDialogOpen(store, WaitForOwnerDialog)) {
            if (isWaitingForOwner(store)) {

                store.dispatch(openWaitForOwnerDialog());

                return next(action);
            }

            // Go back to the app's entry point.
            hideLoginDialog(store);

            store.dispatch(appNavigate(undefined));
        }
        break;
    }

    case CONFERENCE_JOINED:
        if (isWaitingForOwner(store)) {
            store.dispatch(stopWaitForOwner());
        }
        hideLoginDialog(store);
        break;

    case CONFERENCE_LEFT:
        store.dispatch(stopWaitForOwner());
        break;

    case CONNECTION_ESTABLISHED:
        hideLoginDialog(store);
        break;

    case CONNECTION_FAILED: {
        const { error } = action;

        if (error
                && error.name === JitsiConnectionErrors.PASSWORD_REQUIRED
                && typeof error.recoverable === 'undefined') {
            error.recoverable = true;
            store.dispatch(openLoginDialog());
        }
        break;
    }
    }

    return next(action);
});

/**
 * Will clear the wait for conference owner timeout handler if any is currently
 * set.
 *
 * @param {Object} store - The redux store.
 * @returns {void}
 */
function clearExistingWaitForOwnerTimeout(
        { getState }: { getState: Function }) {
    const { waitForOwnerTimeoutID } = getState()['features/authentication'];

    waitForOwnerTimeoutID && clearTimeout(waitForOwnerTimeoutID);
}

/**
 * Hides {@link LoginDialog} if it's currently displayed.
 *
 * @param {Object} store - The redux store.
 * @returns {void}
 */
function hideLoginDialog({ dispatch }: { dispatch: Dispatch<any> }) {
    dispatch(hideDialog(LoginDialog));
}

/**
 * Checks if the cyclic "wait for conference owner" task is currently scheduled.
 *
 * @param {Object} store - The redux store.
 * @returns {boolean}
 */
function isWaitingForOwner({ getState }: { getState: Function }) {
    return getState()['features/authentication'].waitForOwnerTimeoutID;
}
