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
        var avatarUrl = this.getAvatarUrl(id);
    },
    /**
     * Returns the URL of the image for the avatar of a particular user,
     + identified by its jid
     * @param jid
     */
    getAvatarUrl: function (jid) {
        if (config.disableThirdPartyRequests) {
            return 'images/avatar2.png';
        } else {
            if (!jid) {
                console.error("Get avatar - jid is undefined");
                    return null;
            }
            var id = users[jid];

            // If the ID looks like an email, we'll use gravatar.
            // Otherwise, it's a random avatar, and we'll use the configured
            // URL.
            var random = !id || id.indexOf('@') < 0;

            if (!id) {
                console.warn(
                "No avatar stored yet for " + jid + " - using JID as ID");
                id = jid;
            }
            id = MD5.hexdigest(id.trim().toLowerCase());

            // Default to using gravatar.
            var urlPref = 'https://www.gravatar.com/avatar/';
            var urlSuf = "?d=wavatar&size=100";

            if (random && interfaceConfig.RANDOM_AVATAR_URL_PREFIX) {
                urlPref = interfaceConfig.RANDOM_AVATAR_URL_PREFIX;
                urlSuf = interfaceConfig.RANDOM_AVATAR_URL_SUFFIX;
            }

            return urlPref + id + urlSuf;
        }
    }
};


module.exports = Avatar;
