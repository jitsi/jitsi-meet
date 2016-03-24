/* global MD5, config, interfaceConfig */

let users = {};

export default {

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
    },

    /**
     * Returns the URL of the image for the avatar of a particular user,
     * identified by its id.
     * @param {string} userId user id
     */
    getAvatarUrl: function (userId) {
        if (config.disableThirdPartyRequests) {
            return 'images/avatar2.png';
        }

        if (!userId) {
            console.error("Get avatar - id is undefined");
            return null;
        }

        let avatarId = users[userId];

        // If the ID looks like an email, we'll use gravatar.
        // Otherwise, it's a random avatar, and we'll use the configured
        // URL.
        let random = !avatarId || avatarId.indexOf('@') < 0;

        if (!avatarId) {
            console.warn(
                `No avatar stored yet for ${userId} - using ID as avatar ID`);
            avatarId = userId;
        }
        avatarId = MD5.hexdigest(avatarId.trim().toLowerCase());


        let urlPref = null;
        let urlSuf = null;
        if (!random) {
            urlPref = 'https://www.gravatar.com/avatar/';
            urlSuf = "?d=wavatar&size=200";
        }
        else if (random && interfaceConfig.RANDOM_AVATAR_URL_PREFIX) {
            urlPref = interfaceConfig.RANDOM_AVATAR_URL_PREFIX;
            urlSuf = interfaceConfig.RANDOM_AVATAR_URL_SUFFIX;
        }
        else {
            urlPref = 'https://robohash.org/';
            urlSuf = ".png?size=200x200";
        }

        return urlPref + avatarId + urlSuf;
    }
};
