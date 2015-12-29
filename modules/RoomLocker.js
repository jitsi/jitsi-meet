/* global APP, JitsiMeetJS */
import messageHandler from './UI/util/MessageHandler';
import UIUtil from './UI/util/UIUtil';
import AnalyticsAdapter from './statistics/AnalyticsAdapter';

function askForNewPassword () {
    let passMsg = APP.translation.generateTranslationHTML("dialog.passwordMsg");
    let yourPassMsg = APP.translation.translateString("dialog.yourPassword");
    let msg = `
        <h2>${passMsg}</h2>
        <input name="lockKey" type="text"
               data-i18n="[placeholder]dialog.yourPassword"
               placeholder="${yourPassMsg}" autofocus>
    `;

    return new Promise(function (resolve, reject) {
        messageHandler.openTwoButtonDialog(
            null, null, null,
            msg, false, "dialog.Save",
            function (e, v, m, f) {
                if (v && f.lockKey) {
                    resolve(UIUtil.escapeHtml(f.lockKey));
                } else {
                    reject();
                }
            },
            null, null, 'input:first'
        );
    });
}

function askForPassword () {
    let passRequiredMsg = APP.translation.translateString(
        "dialog.passwordRequired"
    );
    let passMsg = APP.translation.translateString("dialog.password");
    let msg = `
        <h2 data-i18n="dialog.passwordRequired">${passRequiredMsg}</h2>
        <input name="lockKey" type="text"
               data-i18n="[placeholder]dialog.password"
               placeholder="${passMsg}" autofocus>
    `;
    return new Promise(function (resolve, reject) {
        messageHandler.openTwoButtonDialog(
            null, null, null, msg,
            true, "dialog.Ok",
            function (e, v, m, f) {}, null,
            function (e, v, m, f) {
                if (v && f.lockKey) {
                    resolve(UIUtil.escapeHtml(f.lockKey));
                } else {
                    reject();
                }
            },
            ':input:first'
        );
    });
}

function askToUnlock () {
    return new Promise(function (resolve, reject) {
        messageHandler.openTwoButtonDialog(
            null, null, "dialog.passwordCheck",
            null, false, "dialog.Remove",
            function (e, v) {
                if (v) {
                    resolve();
                } else {
                    reject();
                }
            }
        );
    });
}

function notifyPasswordNotSupported (err) {
    console.warn('setting password failed', err);
    messageHandler.showError("dialog.warning", "dialog.passwordNotSupported");
}

function notifyPasswordFailed() {
    console.warn('room passwords not supported');
    messageHandler.showError("dialog.lockTitle", "dialog.lockMessage");
}

const ConferenceErrors = JitsiMeetJS.errors.conference;

export default function createRoomLocker (room) {
    let password;

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

    return {
        get isLocked () {
            return !!password;
        },

        get password () {
            return password;
        },

        askToUnlock () {
            return askToUnlock().then(function () {
                return lock();
            }).then(function () {
                AnalyticsAdapter.sendEvent('toolbar.lock.disabled');
            });
        },

        askToLock () {
            return askForNewPassword().then(function (newPass) {
                return lock(newPass);
            }).then(function () {
                AnalyticsAdapter.sendEvent('toolbar.lock.enabled');
            });
        },

        requirePassword () {
            return askForPassword().then(function (newPass) {
                password = newPass;
            });
        },

        notifyModeratorRequired () {
            if (password) {
                messageHandler.openMessageDialog(null, "dialog.passwordError");
            } else {
                messageHandler.openMessageDialog(null, "dialog.passwordError2");
            }
        }
    };
}
