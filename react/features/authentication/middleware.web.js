// @flow

import { maybeRedirectToWelcomePage } from '../app/actions';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT
} from '../base/conference';
import { CONNECTION_ESTABLISHED } from '../base/connection';
import { hideDialog, isDialogOpen } from '../base/dialog';
import {
    JitsiConferenceErrors
} from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';

import {
    CANCEL_LOGIN,
    STOP_WAIT_FOR_OWNER,
    UPGRADE_ROLE_FINISHED,
    WAIT_FOR_OWNER
} from './actionTypes';
import {
    hideLoginDialog,
    openWaitForOwnerDialog,
    stopWaitForOwner,
    waitForOwner
} from './actions.web';
import { LoginDialog, WaitForOwnerDialog } from './components';

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

    case CANCEL_LOGIN: {
        const { dispatch, getState } = store;

        if (!isDialogOpen(store, WaitForOwnerDialog)) {
            if (_isWaitingForOwner(store)) {
                dispatch(openWaitForOwnerDialog());

                return next(action);
            }

            dispatch(hideLoginDialog());

            const { authRequired, conference } = getState()['features/base/conference'];

            // Only end the meeting if we are not already inside and trying to upgrade.
            if (authRequired && !conference) {
                dispatch(maybeRedirectToWelcomePage());
            }
        }
        break;
    }

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

    case CONFERENCE_JOINED:
        if (_isWaitingForOwner(store)) {
            store.dispatch(stopWaitForOwner());
        }
        store.dispatch(hideLoginDialog());
        break;

    case CONFERENCE_LEFT:
        store.dispatch(stopWaitForOwner());
        break;

    case CONNECTION_ESTABLISHED:
        store.dispatch(hideLoginDialog());
        break;

    case STOP_WAIT_FOR_OWNER:
        _clearExistingWaitForOwnerTimeout(store);
        store.dispatch(hideDialog(WaitForOwnerDialog));
        break;

    case UPGRADE_ROLE_FINISHED: {
        const { error, progress } = action;

        if (!error && progress === 1) {
            store.dispatch(hideLoginDialog());
        }
        break;
    }

    case WAIT_FOR_OWNER: {
        _clearExistingWaitForOwnerTimeout(store);

        const { handler, timeoutMs } = action;

        action.waitForOwnerTimeoutID = setTimeout(handler, timeoutMs);

        isDialogOpen(store, LoginDialog)
            || store.dispatch(openWaitForOwnerDialog());
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
function _clearExistingWaitForOwnerTimeout(
        { getState }: { getState: Function }) {
    const { waitForOwnerTimeoutID } = getState()['features/authentication'];

    waitForOwnerTimeoutID && clearTimeout(waitForOwnerTimeoutID);
}

/**
 * Checks if the cyclic "wait for conference owner" task is currently scheduled.
 *
 * @param {Object} store - The redux store.
 * @returns {void}
 */
function _isWaitingForOwner({ getState }: { getState: Function }) {
    return getState()['features/authentication'].waitForOwnerTimeoutID;
}
