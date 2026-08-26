import { CONNECTION_ESTABLISHED, CONNECTION_WILL_CONNECT } from '../base/connection/actionTypes';
import { isDialogOpen } from '../base/dialog/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { APP_STATE_CHANGED } from '../mobile/background/actionTypes';

import { hideLoginRetryDialog, openLoginRetryDialog } from './actions.native';
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
 * connection and no indication of failure.
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
        const { passwordRequired } = state['features/base/connection'];
        const { jwt } = state['features/base/jwt'];

        // passwordRequired is set when the XMPP connection was rejected with
        // not-authorized. With token auth enabled that means the user was sent
        // to the external login page. If the app is back in the foreground
        // with it still set and no JWT has been delivered via a deep link,
        // the login was abandoned and the app is not connected.
        if (passwordRequired
                && !jwt
                && isTokenAuthEnabled(state)
                && !isDialogOpen(store, LoginRetryDialog)) {
            store.dispatch(openLoginRetryDialog());
        }
        break;
    }

    case CONNECTION_ESTABLISHED:
    case CONNECTION_WILL_CONNECT:
        // A deep link with a fresh JWT may be processed right after the app
        // is foregrounded; dismiss the dialog once a new connection attempt
        // starts.
        if (isDialogOpen(store, LoginRetryDialog)) {
            store.dispatch(hideLoginRetryDialog());
        }
        break;
    }

    return next(action);
});
