// @flow

import Logger from '@jitsi/logger';

import { openConnection } from '../../../connection';
import {
    openAuthDialog,
    openLoginDialog } from '../../../react/features/authentication/actions.web';
import { WaitForOwnerDialog } from '../../../react/features/authentication/components';
import {
    isTokenAuthEnabled,
    getTokenAuthUrl
} from '../../../react/features/authentication/functions';
import { getReplaceParticipant } from '../../../react/features/base/config/functions';
import { isDialogOpen } from '../../../react/features/base/dialog';
import { setJWT } from '../../../react/features/base/jwt';
import UIUtil from '../util/UIUtil';

import LoginDialog from './LoginDialog';


let externalAuthWindow;
declare var APP: Object;

const logger = Logger.getLogger(__filename);


/**
 * Authenticate using external service or just focus
 * external auth window if there is one already.
 *
 * @param {JitsiConference} room
 * @param {string} [lockPassword] password to use if the conference is locked
 */
function doExternalAuth(room, lockPassword) {
    const config = APP.store.getState()['features/base/config'];

    if (externalAuthWindow) {
        externalAuthWindow.focus();

        return;
    }

    if (room.isJoined()) {
        let getUrl;

        if (isTokenAuthEnabled(config)) {
            getUrl = Promise.resolve(getTokenAuthUrl(config)(room.getName(), true));
            initJWTTokenListener(room);
        } else {
            getUrl = room.getExternalAuthUrl(true);
        }
        getUrl.then(url => {
            externalAuthWindow = LoginDialog.showExternalAuthDialog(
                url,
                () => {
                    externalAuthWindow = null;
                    if (!isTokenAuthEnabled(config)) {
                        room.join(lockPassword);
                    }
                }
            );
        });
    } else if (isTokenAuthEnabled(config)) {
        redirectToTokenAuthService(room.getName());
    } else {
        room.getExternalAuthUrl().then(UIUtil.redirect);
    }
}

/**
 * Redirect the user to the token authentication service for the login to be
 * performed. Once complete it is expected that the service will bring the user
 * back with "?jwt={the JWT token}" query parameter added.
 * @param {string} [roomName] the name of the conference room.
 */
export function redirectToTokenAuthService(roomName: string) {
    const config = APP.store.getState()['features/base/config'];

    // FIXME: This method will not preserve the other URL params that were
    // originally passed.
    UIUtil.redirect(getTokenAuthUrl(config)(roomName, false));
}

/**
 * Initializes 'message' listener that will wait for a JWT token to be received
 * from the token authentication service opened in a popup window.
 * @param room the name of the conference room.
 */
function initJWTTokenListener(room) {
    /**
     *
     */
    function listener({ data, source }) {
        if (externalAuthWindow !== source) {
            logger.warn('Ignored message not coming '
                + 'from external authnetication window');

            return;
        }

        let jwt;

        if (data && (jwt = data.jwtToken)) {
            logger.info('Received JSON Web Token (JWT):', jwt);

            APP.store.dispatch(setJWT(jwt));

            const roomName = room.getName();

            openConnection({
                retry: false,
                roomName
            }).then(connection => {
                // Start new connection
                const newRoom = connection.initJitsiConference(
                    roomName, APP.conference._getConferenceOptions());

                // Authenticate from the new connection to get
                // the session-ID from the focus, which will then be used
                // to upgrade current connection's user role

                newRoom.room.moderator.authenticate()
                .then(() => {
                    connection.disconnect();

                    // At this point we'll have session-ID stored in
                    // the settings. It will be used in the call below
                    // to upgrade user's role
                    room.room.moderator.authenticate()
                        .then(() => {
                            logger.info('User role upgrade done !');
                            // eslint-disable-line no-use-before-define
                            unregister();
                        })
                        .catch((err, errCode) => {
                            logger.error('Authentication failed: ',
                                err, errCode);
                            unregister();
                        });
                })
                .catch((error, code) => {
                    unregister();
                    connection.disconnect();
                    logger.error(
                        'Authentication failed on the new connection',
                        error, code);
                });
            }, err => {
                unregister();
                logger.error('Failed to open new connection', err);
            });
        }
    }

    /**
     *
     */
    function unregister() {
        window.removeEventListener('message', listener);
    }

    if (window.addEventListener) {
        window.addEventListener('message', listener, false);
    }
}

/**
 * Authenticate for the conference.
 * Uses external service for auth if conference supports that.
 * @param {JitsiConference} room
 * @param {string} [lockPassword] password to use if the conference is locked
 */
function authenticate(room: Object, lockPassword: string) {
    const config = APP.store.getState()['features/base/config'];

    if (isTokenAuthEnabled(config) || room.isExternalAuthEnabled()) {
        doExternalAuth(room, lockPassword);
    } else {
        APP.store.dispatch(openLoginDialog());
    }
}

/**
 * Notify user that authentication is required to create the conference.
 * @param {JitsiConference} room
 * @param {string} [lockPassword] password to use if the conference is locked
 */
function requireAuth(room: Object, lockPassword: string) {
    if (!isDialogOpen(APP.store, WaitForOwnerDialog)) {
        return;
    }

    APP.store.dispatch(
        openAuthDialog(
        room.getName(), authenticate.bind(null, room, lockPassword))
    );
}

/**
 * De-authenticate local user.
 *
 * @param {JitsiConference} room
 * @param {string} [lockPassword] password to use if the conference is locked
 * @returns {Promise}
 */
function logout(room: Object) {
    return new Promise(resolve => {
        room.room.moderator.logout(resolve);
    }).then(url => {
        // de-authenticate conference on the fly
        if (room.isJoined()) {
            const replaceParticipant = getReplaceParticipant(APP.store.getState());

            room.join(null, replaceParticipant);
        }

        return url;
    });
}

export default {
    authenticate,
    logout,
    requireAuth
};
