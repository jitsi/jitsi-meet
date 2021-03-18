<<<<<<< HEAD
// @flow

import Logger from 'jitsi-meet-logger';

import { openConnection } from '../../../connection';
import {
    openWaitForOwnerDialog
} from '../../../react/features/authentication/actions.web';
import {
    isTokenAuthEnabled,
    getTokenAuthUrl
} from '../../../react/features/authentication/constants';
import { setJWT } from '../../../react/features/base/jwt';
import UIUtil from '../util/UIUtil';

import LoginDialog from './LoginDialog';
=======
// /* global config, JitsiMeetJS, Promise */

// import Logger from 'jitsi-meet-logger';
//
// import { openConnection } from '../../../connection';
// import { setJWT } from '../../../react/features/base/jwt';
// import {
//     JitsiConnectionErrors
// } from '../../../react/features/base/lib-jitsi-meet';
// import UIUtil from '../util/UIUtil';
//
// import LoginDialog from './LoginDialog';
>>>>>>> feature(authentication) added onSuccess notification

const logger = Logger.getLogger(__filename);

<<<<<<< HEAD
let externalAuthWindow;
let authRequiredDialog;
declare var APP: Object;

/**
 * Authenticate using external service or just focus
 * external auth window if there is one already.
 *
 * @param {JitsiConference} room
 * @param {string} [lockPassword] password to use if the conference is locked
 */
function doExternalAuth(room, lockPassword) {
    if (externalAuthWindow) {
        externalAuthWindow.focus();
=======
// let externalAuthWindow;
// let authRequiredDialog;

// const isTokenAuthEnabled
//     = typeof config.tokenAuthUrl === 'string' && config.tokenAuthUrl.length;
// const getTokenAuthUrl
//     = JitsiMeetJS.util.AuthUtil.getTokenAuthUrl.bind(null, config.tokenAuthUrl);
>>>>>>> feature(authentication) added onSuccess notification

        return;
    }
    if (room.isJoined()) {
        let getUrl;

        if (isTokenAuthEnabled) {
            getUrl = Promise.resolve(getTokenAuthUrl(room.getName(), true));
            initJWTTokenListener(room);
        } else {
            getUrl = room.getExternalAuthUrl(true);
        }
        getUrl.then(url => {
            externalAuthWindow = LoginDialog.showExternalAuthDialog(
                url,
                () => {
                    externalAuthWindow = null;
                    if (!isTokenAuthEnabled) {
                        room.join(lockPassword);
                    }
                }
            );
        });
    } else if (isTokenAuthEnabled) {
        redirectToTokenAuthService(room.getName());
    } else {
        room.getExternalAuthUrl().then(UIUtil.redirect);
    }
}

<<<<<<< HEAD
/**
 * Redirect the user to the token authentication service for the login to be
 * performed. Once complete it is expected that the service wil bring the user
 * back with "?jwt={the JWT token}" query parameter added.
 * @param {string} [roomName] the name of the conference room.
 */
export function redirectToTokenAuthService(roomName: string) {
    // FIXME: This method will not preserve the other URL params that were
    // originally passed.
    UIUtil.redirect(getTokenAuthUrl(roomName, false));
}

/**
 * Initializes 'message' listener that will wait for a JWT token to be received
 * from the token authentication service opened in a popup window.
 * @param room the name fo the conference room.
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
=======
// /**
//  * Initializes 'message' listener that will wait for a JWT token to be received
//  * from the token authentication service opened in a popup window.
//  * @param room the name fo the conference room.
//  */
// function initJWTTokenListener(room) {
//     /**
//      *
//      */
//     function listener({ data, source }) {
//         if (externalAuthWindow !== source) {
//             logger.warn('Ignored message not coming '
//                 + 'from external authnetication window');
//
//             return;
//         }
//
//         let jwt;
//
//         if (data && (jwt = data.jwtToken)) {
//             logger.info('Received JSON Web Token (JWT):', jwt);
//
//             APP.store.dispatch(setJWT(jwt));
//
//             const roomName = room.getName();
//
//             openConnection({
//                 retry: false,
//                 roomName
//             }).then(connection => {
//                 // Start new connection
//                 const newRoom = connection.initJitsiConference(
//                     roomName, APP.conference._getConferenceOptions());
//
//                 // Authenticate from the new connection to get
//                 // the session-ID from the focus, which wil then be used
//                 // to upgrade current connection's user role
//
//                 newRoom.room.moderator.authenticate()
//                 .then(() => {
//                     connection.disconnect();
//
//                     // At this point we'll have session-ID stored in
//                     // the settings. It wil be used in the call below
//                     // to upgrade user's role
//                     room.room.moderator.authenticate()
//                         .then(() => {
//                             logger.info('User role upgrade done !');
//                             // eslint-disable-line no-use-before-define
//                             unregister();
//                         })
//                         .catch((err, errCode) => {
//                             logger.error('Authentication failed: ',
//                                 err, errCode);
//                             unregister();
//                         });
//                 })
//                 .catch((error, code) => {
//                     unregister();
//                     connection.disconnect();
//                     logger.error(
//                         'Authentication failed on the new connection',
//                         error, code);
//                 });
//             }, err => {
//                 unregister();
//                 logger.error('Failed to open new connection', err);
//             });
//         }
//     }
//
//     /**
//      *
//      */
//     function unregister() {
//         window.removeEventListener('message', listener);
//     }
//
//     if (window.addEventListener) {
//         window.addEventListener('message', listener, false);
//     }
// }
>>>>>>> feature(authentication) added onSuccess notification

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
                // the session-ID from the focus, which wil then be used
                // to upgrade current connection's user role

                newRoom.room.moderator.authenticate()
                .then(() => {
                    connection.disconnect();

                    // At this point we'll have session-ID stored in
                    // the settings. It wil be used in the call below
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
 * Uses external service for auth if conference supports that.
 * @param {JitsiConference} room
 * @param {string} [lockPassword] password to use if the conference is locked
 */
function authenticate(room: Object, lockPassword: string) {
    if (isTokenAuthEnabled || room.isExternalAuthEnabled()) {
        doExternalAuth(room, lockPassword);
    }
}

<<<<<<< HEAD
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
            room.join();
        }

        return url;
    });
}

/**
 * Notify user that authentication is required to create the conference.
 * @param {JitsiConference} room
 * @param {string} [lockPassword] password to use if the conference is locked
 */
function requireAuth(room: Object, lockPassword: string) {
    if (authRequiredDialog) {
        return;
    }

    authRequiredDialog = APP.store.dispatch(openWaitForOwnerDialog(() =>
        authenticate.bind(null, room, lockPassword))
    );
}

export default {
    authenticate,
    requireAuth,
    logout
=======
// /**
//  * De-authenticate local user.
//  *
//  * @param {JitsiConference} room
//  * @param {string} [lockPassword] password to use if the conference is locked
//  * @returns {Promise}
//  */
// function logout(room) {
//     return new Promise(resolve => {
//         room.room.moderator.logout(resolve);
//     }).then(url => {
//         // de-authenticate conference on the fly
//         if (room.isJoined()) {
//             room.join();
//         }
//
//         return url;
//     });
// }

// /**
//  * Notify user that authentication is required to create the conference.
//  * @param {JitsiConference} room
//  * @param {string} [lockPassword] password to use if the conference is locked
//  */
// function requireAuth(room, lockPassword) {
//     if (authRequiredDialog) {
//         return;
//     }
//
//     authRequiredDialog = LoginDialog.showAuthRequiredDialog(
//         room.getName(), authenticate.bind(null, room, lockPassword)
//     );
// }

// /**
//  * Close auth-related dialogs if there are any.
//  */
// function closeAuth() {
//     if (externalAuthWindow) {
//         externalAuthWindow.close();
//         externalAuthWindow = null;
//     }
//
//     if (authRequiredDialog) {
//         authRequiredDialog.close();
//         authRequiredDialog = null;
//     }
// }

export default {
    // authenticate,

    // requireAuth,

    // closeAuth,

    // logout
>>>>>>> feature(authentication) added onSuccess notification
};
