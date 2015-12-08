/* global Strophe, APP, MD5, config, interfaceConfig */
var Settings = require("../../settings/Settings");

var users = {};

var Avatar = {

    /**
     * Sets the user's avatar in the settings menu(if local user), contact list
     * and thumbnail
     * @param jid jid of the user
     * @param id email or userID to be used as a hash
     */
    setUserAvatar: function (jid, id) {
        if (id) {
            if (users[jid] === id) {
                return;
            }
            users[jid] = id;
        }
        var avatarUrl = this.getAvatarUrl(jid);
        var resourceJid = Strophe.getResourceFromJid(jid);

        APP.UI.userAvatarChanged(resourceJid, avatarUrl);
    },
    /**
     * Returns the URL of the image for the avatar of a particular user,
     * identified by its jid
     * @param jid
     * @param jid full MUC jid of the user for whom we want to obtain avatar URL
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
