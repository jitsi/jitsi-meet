/* global $ */
import UIUtil from "../../util/UIUtil";
import UIEvents from "../../../../service/UI/UIEvents";
import Settings from '../../../settings/Settings';

export default {
    init (emitter) {
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
