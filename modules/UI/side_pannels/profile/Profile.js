/* global $ */
import UIUtil from "../../util/UIUtil";
import UIEvents from "../../../../service/UI/UIEvents";
import Settings from '../../../settings/Settings';

const sidePanelsContainerId = 'sideToolbarContainer';
const htmlStr = `
    <div id="profile_container" class="sideToolbarContainer__inner">
        <div class="title" data-i18n="profile.title"></div>
        <div class="sideToolbarBlock first">
            <label class="first" data-i18n="profile.setDisplayNameLabel">
            </label>
            <input class="input-control" type="text" id="setDisplayName"
                data-i18n="[placeholder]settings.name">
        </div>
        <div class="sideToolbarBlock">
            <label data-i18n="profile.setEmailLabel"></label>
            <input id="setEmail" type="text" class="input-control" 
                data-i18n="[placeholder]profile.setEmailInput">
        </div>
        <div id="authenticationContainer" 
             class="sideToolbarBlock auth_container">
            <p data-i18n="toolbar.authenticate"></p>
            <ul>
                <li id="toolbar_auth_identity"></li>
                <li id="toolbar_button_login">
                    <a class="authButton" data-i18n="toolbar.login"></a>
                </li>
                <li id="toolbar_button_logout">
                    <a class="authButton" data-i18n="toolbar.logout"></a>
                </li>
            </ul>
        </div>
    </div>`;

function initHTML() {
    $(`#${sidePanelsContainerId}`)
        .append(htmlStr);
}

export default {
    init (emitter) {
        initHTML();
        // DISPLAY NAME
        function updateDisplayName () {
            emitter.emit(UIEvents.NICKNAME_CHANGED, $('#setDisplayName').val());
        }

        $('#setDisplayName')
            .val(Settings.getDisplayName())
            .keyup(function (event) {
                if (event.keyCode === 13) { // enter
                    updateDisplayName();
                }
            })
            .focusout(updateDisplayName);


        // EMAIL
        function updateEmail () {
            emitter.emit(UIEvents.EMAIL_CHANGED, $('#setEmail').val());
        }

        $('#setEmail')
            .val(Settings.getEmail())
            .keyup(function (event) {
                if (event.keyCode === 13) { // enter
                    updateEmail();
                }
            }).focusout(updateEmail);
    },

    /**
     * Check if settings menu is visible or not.
     * @returns {boolean}
     */
    isVisible () {
        return UIUtil.isVisible(document.getElementById("profile_container"));
    },

    /**
     * Change user display name in the settings menu.
     * @param {string} newDisplayName
     */
    changeDisplayName (newDisplayName) {
        $('#setDisplayName').val(newDisplayName);
    },

    /**
     * Change user avatar in the settings menu.
     * @param {string} avatarUrl url of the new avatar
     */
    changeAvatar (avatarUrl) {
        $('#avatar').attr('src', avatarUrl);
    }
};
