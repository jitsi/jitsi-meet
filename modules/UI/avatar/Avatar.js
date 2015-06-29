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
        var thumbUrl = this.getGravatarUrl(users[jid] || jid, 100);
        var contactListUrl = this.getGravatarUrl(users[jid] || jid);
        var resourceJid = Strophe.getResourceFromJid(jid);

        APP.UI.userAvatarChanged(resourceJid, thumbUrl, contactListUrl);
    },
    getGravatarUrl: function (id, size) {
        if(id === APP.xmpp.myJid() || !id) {
            id = Settings.getSettings().uid;
        }
        return 'https://www.gravatar.com/avatar/' +
            MD5.hexdigest(id.trim().toLowerCase()) +
            "?d=wavatar&size=" + (size || "30");
    }

};


module.exports = Avatar;