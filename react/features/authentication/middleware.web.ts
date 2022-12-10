import { maybeRedirectToWelcomePage } from '../app/actions.web';
import { IStore } from '../app/types';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT
} from '../base/conference/actionTypes';
import { CONNECTION_ESTABLISHED } from '../base/connection/actionTypes';
import { hideDialog } from '../base/dialog/actions';
import { isDialogOpen } from '../base/dialog/functions';
import {
    JitsiConferenceErrors
} from '../base/lib-jitsi-meet';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import {
    CANCEL_LOGIN,
    STOP_WAIT_FOR_OWNER,
    UPGRADE_ROLE_FINISHED,
    WAIT_FOR_OWNER
} from './actionTypes';
import {
    hideLoginDialog,
    openWaitForOwnerDialog,
    stopWaitForOwner
} from './actions.web';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
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
            const { passwordRequired } = getState()['features/base/connection'];

            // Only end the meeting if we are not already inside and trying to upgrade.
            if ((authRequired && !conference) || passwordRequired) {
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
            // we haven't migrated all the code from AuthHandler, and we need for now conference.js to trigger
            // the dialog to pass all required parameters to WaitForOwnerDialog
            // keep it commented, so we do not trigger sending iqs to jicofo twice
            // and showing the broken dialog with no handler
            // store.dispatch(waitForOwner());
        } else {
            store.dispatch(stopWaitForOwner());
        }
        break;
    }

    case CONFERENCE_JOINED:
        store.dispatch(stopWaitForOwner());
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

        const { handler, timeoutMs }: { handler: () => void; timeoutMs: number; } = action;

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
        { getState }: IStore) {
    const { waitForOwnerTimeoutID } = getState()['features/authentication'];

    waitForOwnerTimeoutID && clearTimeout(waitForOwnerTimeoutID);
}

/**
 * Checks if the cyclic "wait for conference owner" task is currently scheduled.
 *
 * @param {Object} store - The redux store.
 * @returns {void}
 */
function _isWaitingForOwner({ getState }: IStore) {
    return getState()['features/authentication'].waitForOwnerTimeoutID;
}
