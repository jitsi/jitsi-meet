/* global Strophe, APP, MD5, config, interfaceConfig */
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
     * where current dominant speaker is presented.
     * @param id id of the user for whom we want to obtain avatar URL
     */
    getDominantSpeakerUrl: function (id) {
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

        // Default to using gravatar.
        var urlPref = 'https://www.gravatar.com/avatar/';
        var urlSuf = "?d=wavatar&size=" + (size || "30");

        // If we have a real email we will use it for the gravatar and we'll
        // use the pre-configured URL if any. Otherwise, it's a random avatar.
        var email = users[id];
        if (email && email.indexOf('@')) {
            id = email;

            if (interfaceConfig.RANDOM_AVATAR_URL_PREFIX) {
                urlPref = interfaceConfig.RANDOM_AVATAR_URL_PREFIX;
                urlSuf = interfaceConfig.RANDOM_AVATAR_URL_SUFFIX;
            }
        }

        if (!config.disableThirdPartyRequests) {
            return urlPref +
                MD5.hexdigest(id.trim().toLowerCase()) +
                urlSuf;
        } else {
            return 'images/avatar2.png';
        }
    }

};


module.exports = Avatar;
