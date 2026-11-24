import { CONNECTION_ESTABLISHED, CONNECTION_WILL_CONNECT } from '../base/connection/actionTypes';
import { isDialogOpen } from '../base/dialog/functions';
import { SET_JWT } from '../base/jwt/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { APP_STATE_CHANGED } from '../mobile/background/actionTypes';

import { hideLoginRetryDialog, openLoginRetryDialog, setTokenAuthPending } from './actions.native';
import LoginRetryDialog from './components/native/LoginRetryDialog';
import { isTokenAuthEnabled } from './functions.native';

import './middleware.any';

/**
 * Middleware that detects the app returning to the foreground while an
 * external token authentication is still pending and warns the user that they
 * are not connected to the meeting.
 *
 * Opening {@code tokenAuthUrl} in the system browser is fire-and-forget: if
 * the user abandons the login page and switches back to the app, no deep link
 * is ever delivered and the app keeps showing the conference screen with no
 * connection and no indication of failure. The pending state is tracked with
 * an explicit flag (set when the browser is opened, cleared when a new
 * connection attempt starts) because the connection-level error state cannot
 * be relied upon: on WebSocket deployments the not-authorized failure is
 * immediately followed by a connection-dropped failure which resets it.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_STATE_CHANGED: {
        if (action.appState !== 'active') {
            break;
        }

        const state = store.getState();
        const { tokenAuthPending } = state['features/authentication'];
        const { conference, room } = state['features/base/conference'];
        const { jwt } = state['features/base/jwt'];

        // The app is back in the foreground on the conference screen with the
        // external login still pending: no conference was joined and no JWT
        // has been delivered via a deep link, so the login was abandoned and
        // the app is not connected.
        if (tokenAuthPending
                && room
                && !conference
                && !jwt
                && isTokenAuthEnabled(state)
                && !isDialogOpen(store, LoginRetryDialog)) {
            store.dispatch(openLoginRetryDialog());
        }
        break;
    }

    case SET_JWT:
        // SET_JWT with no token is the periodic clearing that happens on
        // every navigation; only a delivered token completes the login.
        if (!action.jwt) {
            break;
        }

    // eslint-disable-next-line no-fallthrough
    case CONNECTION_ESTABLISHED:
    case CONNECTION_WILL_CONNECT: {
        // The external login is no longer pending once the deep link delivers
        // a JWT (the room may first land on the prejoin screen, where no
        // connection attempt is started yet) or a new connection attempt
        // starts.
        const { dispatch, getState } = store;

        if (getState()['features/authentication'].tokenAuthPending) {
            dispatch(setTokenAuthPending(false));
        }
        if (isDialogOpen(store, LoginRetryDialog)) {
            dispatch(hideLoginRetryDialog());
        }
        break;
    }
    }

    return next(action);
});
