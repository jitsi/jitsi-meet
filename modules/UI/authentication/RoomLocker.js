/* global APP, $, JitsiMeetJS */
import UIUtil from '../util/UIUtil';

/**
 * Show dialog which asks user for new password for the conference.
 * @returns {Promise<string>} password or nothing if user canceled
 */
function askForNewPassword () {
    let titleKey = "dialog.passwordMsg";
    let titleString = APP.translation.generateTranslationHTML(titleKey);
    let yourPassMsg = APP.translation.translateString("dialog.yourPassword");
    let msgString = (`
        <input name="lockKey" type="text"
               data-i18n="[placeholder]dialog.yourPassword"
               placeholder="${yourPassMsg}" autofocus>
    `);

    return new Promise(function (resolve, reject) {
        APP.UI.messageHandler.openTwoButtonDialog({
            titleKey,
            titleString,
            msgString,
            leftButtonKey: "dialog.Save",
            submitFunction: function (e, v, m, f) {
                if (v && f.lockKey) {
                    resolve(UIUtil.escapeHtml(f.lockKey));
                }
                else {
                    reject(APP.UI.messageHandler.CANCEL);
                }
            },
            focus: 'input:first'
        });
    });
}

/**
 * Show dialog which asks for required conference password.
 * @returns {Promise<string>} password or nothing if user canceled
 */
function askForPassword () {
    let titleKey = "dialog.passwordRequired";
    let passMsg = APP.translation.translateString("dialog.password");
    let msgString = `
        <input name="lockKey" type="text"
               data-i18n="[placeholder]dialog.password"
               placeholder="${passMsg}" autofocus>
    `;
    return new Promise(function (resolve, reject) {
        APP.UI.messageHandler.openTwoButtonDialog({
            titleKey,
            msgString,
            leftButtonKey: "dialog.Ok",
            submitFunction: $.noop,
            closeFunction: function (e, v, m, f) {
                if (v && f.lockKey) {
                    resolve(UIUtil.escapeHtml(f.lockKey));
                } else {
                    reject(APP.UI.messageHandler.CANCEL);
                }
            },
            focus: ':input:first'
        });
    });
}

/**
 * Show dialog which asks if user want remove password from the conference.
 * @returns {Promise}
 */
function askToUnlock () {
    return new Promise(function (resolve, reject) {
        APP.UI.messageHandler.openTwoButtonDialog({
            titleString: 'Unlock room',
            msgKey: "dialog.passwordCheck",
            leftButtonKey: "dialog.Remove",
            submitFunction: function (e, v) {
                if (v) {
                    resolve();
                } else {
                    reject(APP.UI.messageHandler.CANCEL);
                }
            }
        });
    });
}

/**
 * Show notification that user cannot set password for the conference
 * because server doesn't support that.
 */
function notifyPasswordNotSupported () {
    console.warn('room passwords not supported');
    APP.UI.messageHandler.showError(
        "dialog.warning", "dialog.passwordNotSupported");
}

/**
 * Show notification that setting password for the conference failed.
 * @param {Error} err error
 */
function notifyPasswordFailed(err) {
    console.warn('setting password failed', err);
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
    let dialog = null;

    /**
     * If the room was locked from someone other than us, we indicate it with
     * this property in order to have correct roomLocker state of isLocked.
     * @type {boolean} whether room is locked, but not from us.
     */
    let lockedElsewhere = false;

    /*
     * Allows to set new password
     * @param newPass
     * @returns {Promise.<TResult>}
     */
    function lock (newPass) {
        return room.lock(newPass).then(function () {
            password = newPass;
        }).catch(function (err) {
            console.error(err);
            if (err === ConferenceErrors.PASSWORD_NOT_SUPPORTED) {
                notifyPasswordNotSupported();
            } else {
                notifyPasswordFailed(err);
            }
            throw err;
        });
    }

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

        lock,

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
         * Allows to remove password from the conference (asks user first).
         * @returns {Promise}
         */
        askToUnlock () {
            return askToUnlock().then(
                () => { return lock(); }
            ).then(function () {
                JitsiMeetJS.analytics.sendEvent('toolbar.lock.disabled');
            }).catch(
                reason => {
                    if (reason !== APP.UI.messageHandler.CANCEL)
                        console.error(reason);
                }
            );
        },

        /**
         * Allows to set password for the conference.
         * It asks user for new password and locks the room.
         * @returns {Promise}
         */
        askToLock () {
            return askForNewPassword().then(
                newPass => { return lock(newPass);}
            ).then(function () {
                JitsiMeetJS.analytics.sendEvent('toolbar.lock.enabled');
            }).catch(
                reason => {
                    if (reason !== APP.UI.messageHandler.CANCEL)
                        console.error(reason);
                }
            );
        },

        /**
         * Asks user for required conference password.
         */
        requirePassword () {
            return askForPassword().then(
                newPass => { password = newPass; }
            ).catch(
                reason => {
                    // user canceled, no pass was entered.
                    // clear, as if we use the same instance several times
                    // pass stays between attempts
                    password = null;
                    if (reason !== APP.UI.messageHandler.CANCEL)
                        console.error(reason);
                }
            );
        },

        /**
         * Show notification that to set/remove password user must be moderator.
         */
        notifyModeratorRequired () {
            if (dialog)
                return;

            let closeCallback = function () {
                dialog = null;
            };

            if (this.isLocked) {
                dialog = APP.UI.messageHandler
                    .openMessageDialog(null, "dialog.passwordError",
                        null, null, closeCallback);
            } else {
                dialog = APP.UI.messageHandler
                    .openMessageDialog(null, "dialog.passwordError2",
                        null, null, closeCallback);
            }
        }
    };
}
