/* global APP, JitsiMeetJS */
const logger = require("jitsi-meet-logger").getLogger(__filename);

import RequirePasswordDialog from './RequirePasswordDialog';

/**
 * Show notification that user cannot set password for the conference
 * because server doesn't support that.
 */
function notifyPasswordNotSupported () {
    logger.warn('room passwords not supported');
    APP.UI.messageHandler.showError(
        "dialog.warning", "dialog.passwordNotSupported");
}

/**
 * Show notification that setting password for the conference failed.
 * @param {Error} err error
 */
function notifyPasswordFailed(err) {
    logger.warn('setting password failed', err);
    APP.UI.messageHandler.showError(
        "dialog.lockTitle", "dialog.lockMessage");
}

const ConferenceErrors = JitsiMeetJS.errors.conference;

/**
 * Create new RoomLocker for the conference.
 * It allows to set or remove password for the conference,
 * or ask for required password.
 * @returns {RoomLocker}
 */
export default function createRoomLocker (room) {
    let password;
    let requirePasswordDialog = new RequirePasswordDialog();
    /**
     * If the room was locked from someone other than us, we indicate it with
     * this property in order to have correct roomLocker state of isLocked.
     * @type {boolean} whether room is locked, but not from us.
     */
    let lockedElsewhere = false;

    /**
     * @class RoomLocker
     */
    return {
        get isLocked () {
            return !!password || lockedElsewhere;
        },

        get password () {
            return password;
        },

        /**
         * Allows to set new password
         * @param newPass
         * @returns {Promise.<TResult>}
         */
        lock (newPass) {
            return room.lock(newPass).then(() => {
                password = newPass;
                // If the password is undefined this means that we're removing
                // it for everyone.
                if (!password)
                    lockedElsewhere = false;
            }).catch(function (err) {
                logger.error(err);
                if (err === ConferenceErrors.PASSWORD_NOT_SUPPORTED) {
                    notifyPasswordNotSupported();
                } else {
                    notifyPasswordFailed(err);
                }
                throw err;
            });
        },

        /**
         * Sets that the room is locked from another user, not us.
         * @param {boolean} value locked/unlocked state
         */
        set lockedElsewhere (value) {
            lockedElsewhere = value;
        },

        /**
         * Whether room is locked from someone else.
         * @returns {boolean} whether room is not locked locally,
         * but it is still locked.
         */
        get lockedElsewhere () {
            return lockedElsewhere;
        },

        /**
         * Reset the password. Can be useful when room
         * has been unlocked from elsewhere and we can use
         * this method for sync the pass
         */
        resetPassword() {
            password = null;
        },

        /**
         * Asks user for required conference password.
         */
        requirePassword () {
            return requirePasswordDialog.askForPassword().then(
                newPass => { password = newPass; }
            ).catch(
                reason => {
                    // user canceled, no pass was entered.
                    // clear, as if we use the same instance several times
                    // pass stays between attempts
                    password = null;
                    if (reason !== APP.UI.messageHandler.CANCEL)
                        logger.error(reason);
                }
            );
        },

        /**
         * Hides require password dialog
         */
        hideRequirePasswordDialog() {
            if (requirePasswordDialog.isOpened) {
                requirePasswordDialog.close();
            }
        }
    };
}
