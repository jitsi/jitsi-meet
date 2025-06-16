import { IStore } from '../app/types';
import { APP_WILL_NAVIGATE } from '../base/app/actionTypes';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT
} from '../base/conference/actionTypes';
import { isRoomValid } from '../base/conference/functions';
import { CONNECTION_ESTABLISHED, CONNECTION_FAILED } from '../base/connection/actionTypes';
import { hideDialog } from '../base/dialog/actions';
import { isDialogOpen } from '../base/dialog/functions';
import {
    JitsiConferenceErrors,
    JitsiConnectionErrors
} from '../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../base/media/constants';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { isLocalTrackMuted } from '../base/tracks/functions.any';
import { parseURIString } from '../base/util/uri';
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
    openTokenAuthUrl,
    openWaitForOwnerDialog,
    redirectToDefaultLocation,
    setTokenAuthUrlSuccess,
    stopWaitForOwner,
    waitForOwner
} from './actions';
import { LoginDialog, WaitForOwnerDialog } from './components';
import { getTokenAuthUrl, isTokenAuthEnabled } from './functions';
import logger from './logger';


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

    case CONFERENCE_JOINED: {
        const { dispatch, getState } = store;
        const state = getState();
        const config = state['features/base/config'];

        if (isTokenAuthEnabled(config)
            && config.tokenAuthUrlAutoRedirect
            && state['features/base/jwt'].jwt) {
            // auto redirect is turned on and we have successfully logged in
            // let's mark that
            dispatch(setTokenAuthUrlSuccess(true));
        }

        if (_isWaitingForOwner(store)) {
            store.dispatch(stopWaitForOwner());
        }
        store.dispatch(hideLoginDialog());
        break;
    }

    case CONFERENCE_LEFT:
        store.dispatch(stopWaitForOwner());
        break;

    case CONNECTION_ESTABLISHED:
        store.dispatch(hideLoginDialog());
        break;

    case CONNECTION_FAILED: {
        const { error } = action;
        const { getState } = store;
        const state = getState();
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
        _handleLogout(store);

        break;
    }

    case APP_WILL_NAVIGATE: {
        const { dispatch, getState } = store;
        const state = getState();
        const config = state['features/base/config'];
        const room = state['features/base/conference'].room;

        if (isRoomValid(room)
            && config.tokenAuthUrl && config.tokenAuthUrlAutoRedirect
            && state['features/authentication'].tokenAuthUrlSuccessful
            && !state['features/base/jwt'].jwt) {
            // if we have auto redirect enabled, and we have previously logged in successfully
            // we will redirect to the auth url to get the token and login again
            // we want to mark token auth success to false as if login is unsuccessful
            // the participant can join anonymously and not go in login loop
            dispatch(setTokenAuthUrlSuccess(false));
        }

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
    const room = state['features/base/conference'].room;
    const { locationURL = { href: '' } as URL } = state['features/base/connection'];
    const { tenant } = parseURIString(locationURL.href) || {};
    const { enabled: audioOnlyEnabled } = state['features/base/audio-only'];
    const audioMuted = isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.AUDIO);
    const videoMuted = isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.VIDEO);

    if (!room) {
        logger.warn('Cannot handle login, room is undefined!');

        return;
    }

    if (!isTokenAuthEnabled(config)) {
        dispatch(openLoginDialog());

        return;
    }

    getTokenAuthUrl(
        config,
        locationURL,
        {
            audioMuted,
            audioOnlyEnabled,
            skipPrejoin: true,
            videoMuted
        },
        room,
        tenant
    )
        .then((tokenAuthServiceUrl: string | undefined) => {
            if (!tokenAuthServiceUrl) {
                logger.warn('Cannot handle login, token service URL is not set');

                return;
            }

            return dispatch(openTokenAuthUrl(tokenAuthServiceUrl));
        });
}

/**
 * Handles logout challenge. Opens logout dialog and hangs up the conference.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {string} logoutUrl - The url for logging out.
 * @returns {void}
 */
function _handleLogout({ dispatch, getState }: IStore) {
    const state = getState();
    const { conference } = state['features/base/conference'];

    if (!conference) {
        return;
    }

    dispatch(openLogoutDialog());
}
