/* global APP, $ */

import UIUtil from '../util/UIUtil';

/**
 * Show dialog which asks for required conference password.
 * @returns {Promise<string>} password or nothing if user canceled
 */
export default function askForPassword () {
    let titleKey = "dialog.passwordRequired";
    let msgString = `
        <input name="lockKey" type="text"
               data-i18n="[placeholder]dialog.password"
               autofocus>`;
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