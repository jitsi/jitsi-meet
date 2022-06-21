import Logger from '@jitsi/logger';

import {
    openAuthDialog,
    openLoginDialog } from '../../../react/features/authentication/actions.web';
import {
    LoginDialog,
    WaitForOwnerDialog
} from '../../../react/features/authentication/components';
import { getReplaceParticipant } from '../../../react/features/base/config/functions';
import { isDialogOpen } from '../../../react/features/base/dialog';
import { setPrejoinPageVisibility } from '../../../react/features/prejoin';

declare var APP: Object;

const logger = Logger.getLogger(__filename);


/**
 * Authenticate for the conference.
 */
function authenticate() {
    APP.store.dispatch(setPrejoinPageVisibility(false));
    APP.store.dispatch(openLoginDialog());
}

/**
 * Notify user that authentication is required to create the conference.
 * @param {JitsiConference} room
 */
function requireAuth(room: Object) {
    if (isDialogOpen(APP.store, WaitForOwnerDialog) || isDialogOpen(APP.store, LoginDialog)) {
        return;
    }

    APP.store.dispatch(openAuthDialog(room.getName(), authenticate));
}

/**
 * De-authenticate local user.
 *
 * @param {JitsiConference} room
 * @param {string} [lockPassword] password to use if the conference is locked
 * @returns {Promise}
 */
function logout(room: Object) {
    return new Promise((resolve, reject) => {
        /**
         * Handle logout result.
         * 
         * @param {Error|undefined} error Did the operation result in error or not.
         */
        function cb(error) {
            if (error) {
                reject(error);
            } else {
                // de-authenticate conference on the fly
                if (room.isJoined()) {
                    const replaceParticipant = getReplaceParticipant(APP.store.getState());

                    room.join(null, replaceParticipant);
                }

                resolve();
            }
        }

        room.room.moderator.logout(cb);
    });
}

export default {
    authenticate,
    logout,
    requireAuth
};
