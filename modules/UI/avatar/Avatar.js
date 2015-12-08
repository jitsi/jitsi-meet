/* global Strophe, APP, MD5, config */
var Settings = require("../../settings/Settings");

var users = {};

var Avatar = {

    /**
     * Sets the user's avatar in the settings menu(if local user), contact list
     * and thumbnail
     * @param id id of the user
     * @param email email or nickname to be used as a hash
     */
  setUserAvatar: function (id, email) {
        if (email) {
            if (users[id] === email) {
                return;
            }
            users[id] = email;
        }
        var thumbUrl = this.getThumbUrl(id);
        var contactListUrl = this.getContactListUrl(id);
    },
    /**
     * Returns image URL for the avatar to be displayed on large video area
     * where current active speaker is presented.
     * @param id id of the user for whom we want to obtain avatar URL
     */
    getActiveSpeakerUrl: function (id) {
        return this.getGravatarUrl(id, 100);
    },
    /**
     * Returns image URL for the avatar to be displayed on small video thumbnail
     * @param id id of the user for whom we want to obtain avatar URL
     */
    getThumbUrl: function (id) {
        return this.getGravatarUrl(id, 100);
    },
    /**
     * Returns the URL for the avatar to be displayed as contactlist item
     * @param id id of the user for whom we want to obtain avatar URL
     */
    getContactListUrl: function (id) {
        return this.getGravatarUrl(id, 30);
    },
    getGravatarUrl: function (id, size) {
        if (!id) {
            console.error("Get gravatar - id is undefined");
            return null;
        }
        var email = users[id];
        if (!email) {
            console.warn(
                "No avatar stored yet for " + id + " - using user id as ID"
            );
            email = id;
        }
        if (!config.disableThirdPartyRequests) {
            return 'https://www.gravatar.com/avatar/' +
                MD5.hexdigest(id.trim().toLowerCase()) +
                "?d=wavatar&size=" + (size || "30");
        } else {
            return 'images/avatar2.png';
        }
    }

};


module.exports = Avatar;
