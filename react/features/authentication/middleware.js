import { MiddlewareRegistry } from '../base/redux';

import {
    clearWaitForOwnerTimeout,
    _showLoginDialog,
    _showWaitForOwnerDialog,
    waitForOwner
} from './actions';
import { appNavigate } from '../app/actions';
import {
    CANCEL_LOGIN,
    CANCEL_WAIT_FOR_OWNER,
    STOP_WAIT_FOR_OWNER,
    WAIT_FOR_OWNER
} from './actionTypes';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT
} from '../base/conference/actionTypes';
import { hideDialog } from '../base/dialog/actions';
import { CONNECTION_ESTABLISHED } from '../base/connection/actionTypes';
import { CONNECTION_FAILED } from '../base/connection';
import {
    clearExistingWaitForOwnerTimeout,
    hideLoginDialog,
    isLoginDialogOpened,
    isWaitForOwnerDialogOpened,
    isWaitingForOwner
} from './functions';
import {
    JitsiConferenceErrors,
    JitsiConnectionErrors
} from '../base/lib-jitsi-meet';

/**
 * Middleware that captures connection or conference failed errors and controlls
 * {@link WaitForOwnerDialog} and {@link LoginDialog}.
 *
 * FIXME Some of the complexity was introduced by the lack of dialog stacking.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONNECTION_FAILED: {
        if (action.error === JitsiConnectionErrors.PASSWORD_REQUIRED) {
            store.dispatch(_showLoginDialog());
        }
        break;
    }
    case CONNECTION_ESTABLISHED: {
        hideLoginDialog(store);
        break;
    }
    case CONFERENCE_FAILED: {
        if (action.error === JitsiConferenceErrors.AUTHENTICATION_REQUIRED) {
            store.dispatch(waitForOwner());
        } else {
            store.dispatch(clearWaitForOwnerTimeout());
        }
        break;
    }
    case CONFERENCE_JOINED: {
        if (isWaitingForOwner(store)) {
            store.dispatch(clearWaitForOwnerTimeout());
        }
        hideLoginDialog(store);
        break;
    }
    case CONFERENCE_LEFT: {
        store.dispatch(clearWaitForOwnerTimeout());
        break;
    }
    case WAIT_FOR_OWNER: {
        clearExistingWaitForOwnerTimeout(store);
        const { handler, timeoutMs } = action;
        const newTimeoutId = setTimeout(handler, timeoutMs);

        action.waitForOwnerTimeoutID = newTimeoutId;

        // The WAIT_FOR_OWNER action is cyclic and we don't want to hide
        // the login dialog every few seconds...
        if (!isLoginDialogOpened(store.getState())) {
            store.dispatch(_showWaitForOwnerDialog());
        }
        break;
    }
    case STOP_WAIT_FOR_OWNER: {
        clearExistingWaitForOwnerTimeout(store);
        if (isWaitForOwnerDialogOpened(store)) {
            store.dispatch(hideDialog());
        }
        break;
    }
    case CANCEL_LOGIN: {
        const { upgradeRoleInProgress }
            = store.getState()['features/authentication'];

        if (upgradeRoleInProgress) {
            upgradeRoleInProgress.cancel();
        }

        const waitingForOwner = isWaitingForOwner(store);

        // The LoginDialog can be opened on top of "wait for owner". The app
        // should navigate only if LoginDialog was open without
        // the WaitForOwnerDialog.
        if (!isWaitForOwnerDialogOpened(store) && !waitingForOwner) {
            // Go back to app entry point
            hideLoginDialog(store);
            store.dispatch(appNavigate(undefined));
        } else if (!isWaitForOwnerDialogOpened(store) && waitingForOwner) {
            // Instead of hiding show the new one.
            const result = next(action);

            store.dispatch(_showWaitForOwnerDialog());

            return result;
        }
        break;
    }
    case CANCEL_WAIT_FOR_OWNER: {
        const result = next(action);

        store.dispatch(clearWaitForOwnerTimeout());
        store.dispatch(appNavigate(undefined));

        return result;
    }

    }

    return next(action);
});
