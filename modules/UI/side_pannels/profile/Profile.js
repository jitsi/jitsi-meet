/* global $, APP, JitsiMeetJS */
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
        <div id="profile_auth_container"
             class="sideToolbarBlock auth_container">
            <p data-i18n="toolbar.authenticate"></p>
            <ul>
                <li id="profile_auth_identity"></li>
                <li id="profile_button_login">
                    <a class="authButton" data-i18n="toolbar.login"></a>
                </li>
                <li id="profile_button_logout">
                    <a class="authButton" data-i18n="toolbar.logout"></a>
                </li>
            </ul>
        </div>
    </div>`;

function initHTML() {
    $(`#${sidePanelsContainerId}`)
        .append(htmlStr);
    // make sure we translate the panel, as adding it can be after i18n
    // library had initialized and translated already present html
    APP.translation.translateElement($(`#${sidePanelsContainerId}`));
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

        // LOGIN
        function loginClicked () {
            JitsiMeetJS.analytics.sendEvent('authenticate.login.clicked');
            emitter.emit(UIEvents.AUTH_CLICKED);
        }

        $('#profile_button_login').click(loginClicked);

        // LOGOUT
        function logoutClicked () {
            let titleKey = "dialog.logoutTitle";
            let msgKey = "dialog.logoutQuestion";
            JitsiMeetJS.analytics.sendEvent('authenticate.logout.clicked');
            // Ask for confirmation
            APP.UI.messageHandler.openTwoButtonDialog({
                titleKey: titleKey,
                msgKey: msgKey,
                leftButtonKey: "dialog.Yes",
                submitFunction: function (evt, yes) {
                    if (yes) {
                        emitter.emit(UIEvents.LOGOUT);
                    }
                }
            });
        }

        $('#profile_button_logout').click(logoutClicked);
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
    },

    /**
     * Change the value of the field for the user email.
     * @param {string} email the new value that will be displayed in the field.
     */
    changeEmail (email) {
        $('#setEmail').val(email);
    },

    /**
     * Shows or hides authentication related buttons
     * @param {boolean} show <tt>true</tt> to show or <tt>false</tt> to hide
     */
    showAuthenticationButtons (show) {
        let id = 'profile_auth_container';
        UIUtil.setVisible(id, show);
    },

    /**
     * Shows/hides login button.
     * @param {boolean} show <tt>true</tt> to show or <tt>false</tt> to hide
     */
    showLoginButton (show) {
        let id = 'profile_button_login';

        UIUtil.setVisible(id, show);
    },

    /**
     * Shows/hides logout button.
     * @param {boolean} show <tt>true</tt> to show or <tt>false</tt> to hide
     */
    showLogoutButton (show) {
        let id = 'profile_button_logout';

        UIUtil.setVisible(id, show);
    },

    /**
     * Displays user's authenticated identity name (login).
     * @param {string} authIdentity identity name to be displayed.
     */
    setAuthenticatedIdentity (authIdentity) {
        let id = 'profile_auth_identity';

        UIUtil.setVisible(id, !!authIdentity);

        $(`#${id}`).text(authIdentity ? authIdentity : '');
    }
};
