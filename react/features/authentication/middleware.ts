import { IStore } from '../app/types';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT
} from '../base/conference/actionTypes';
import { CONNECTION_ESTABLISHED, CONNECTION_FAILED } from '../base/connection/actionTypes';
import { hangup } from '../base/connection/actions';
import { hideDialog } from '../base/dialog/actions';
import { isDialogOpen } from '../base/dialog/functions';
import {
    JitsiConferenceErrors,
    JitsiConnectionErrors
} from '../base/lib-jitsi-meet';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { getBackendSafeRoomName } from '../base/util/uri';
import { showErrorNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';
import { openLogoutDialog } from '../settings/actions';

import {
    CANCEL_LOGIN,
    LOGIN,
    LOGOUT,
    STOP_WAIT_FOR_OWNER,
    UPGRADE_ROLE_FINISHED,
    WAIT_FOR_OWNER
} from './actionTypes';
import {
    hideLoginDialog,
    openLoginDialog,
    openWaitForOwnerDialog,
    redirectToDefaultLocation,
    stopWaitForOwner,
    waitForOwner } from './actions';
import { LoginDialog, WaitForOwnerDialog } from './components';
import { getTokenAuthUrl, isTokenAuthEnabled } from './functions';

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
        const state = getState();
        const { thenableWithCancel } = state['features/authentication'];

        thenableWithCancel?.cancel();

        // The LoginDialog can be opened on top of "wait for owner". The app
        // should navigate only if LoginDialog was open without the
        // WaitForOwnerDialog.
        if (!isDialogOpen(store, WaitForOwnerDialog)) {
            if (_isWaitingForOwner(store)) {
                // Instead of hiding show the new one.
                const result = next(action);

                dispatch(openWaitForOwnerDialog());

                return result;
            }

            dispatch(hideLoginDialog());

            const { authRequired, conference } = state['features/base/conference'];
            const { passwordRequired } = state['features/base/connection'];

            // Only end the meeting if we are not already inside and trying to upgrade.
            // NOTE: Despite it's confusing name, `passwordRequired` implies an XMPP
            // connection auth error.
            if ((passwordRequired || authRequired) && !conference) {
                dispatch(redirectToDefaultLocation());
            }
        }
        break;
    }

    case CONFERENCE_FAILED: {
        const { error } = action;

        // XXX The feature authentication affords recovery from
        // CONFERENCE_FAILED caused by
        // JitsiConferenceErrors.AUTHENTICATION_REQUIRED.
        let recoverable;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [ _lobbyJid, lobbyWaitingForHost ] = error.params;

        if (error.name === JitsiConferenceErrors.AUTHENTICATION_REQUIRED
            || (error.name === JitsiConferenceErrors.MEMBERS_ONLY_ERROR && lobbyWaitingForHost)) {
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

    case CONNECTION_FAILED: {
        const { error } = action;
        const state = store.getState();
        const { jwt } = state['features/base/jwt'];

        if (error
                && error.name === JitsiConnectionErrors.PASSWORD_REQUIRED
                && typeof error.recoverable === 'undefined'
                && !jwt) {
            error.recoverable = true;

            _handleLogin(store);
        }

        break;
    }

    case LOGIN: {
        _handleLogin(store);

        break;
    }

    case LOGOUT: {
        const { conference } = store.getState()['features/base/conference'];

        if (!conference) {
            break;
        }

        store.dispatch(openLogoutDialog(() => {
            const logoutUrl = store.getState()['features/base/config'].tokenLogoutUrl;

            if (logoutUrl) {
                window.location.href = logoutUrl;

                return;
            }

            conference.room.moderator.logout(() => store.dispatch(hangup(true)));
        }));

        break;
    }

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

        // The WAIT_FOR_OWNER action is cyclic, and we don't want to hide the
        // login dialog every few seconds.
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
function _clearExistingWaitForOwnerTimeout({ getState }: IStore) {
    const { waitForOwnerTimeoutID } = getState()['features/authentication'];

    waitForOwnerTimeoutID && clearTimeout(waitForOwnerTimeoutID);
}


/**
 * Checks if the cyclic "wait for conference owner" task is currently scheduled.
 *
 * @param {Object} store - The redux store.
 * @returns {boolean}
 */
function _isWaitingForOwner({ getState }: IStore) {
    return Boolean(getState()['features/authentication'].waitForOwnerTimeoutID);
}

/**
 * Handles login challenge. Opens login dialog or redirects to token auth URL.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @returns {void}
 */
function _handleLogin({ dispatch, getState }: IStore) {
    const state = getState();
    const config = state['features/base/config'];
    const room = getBackendSafeRoomName(state['features/base/conference'].room);

    if (isTokenAuthEnabled(config)) {
        if (typeof APP === 'undefined') {
            dispatch(showErrorNotification({
                descriptionKey: 'dialog.tokenAuthUnsupported',
                titleKey: 'dialog.tokenAuthFailedTitle'
            }, NOTIFICATION_TIMEOUT_TYPE.LONG));

            dispatch(redirectToDefaultLocation());

            return;
        }

        // FIXME: This method will not preserve the other URL params that were originally passed.
        // redirectToTokenAuthService
        window.location.href = getTokenAuthUrl(config)(room, false);
    } else {
        dispatch(openLoginDialog());
    }
}
