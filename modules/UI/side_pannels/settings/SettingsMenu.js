var Avatar = require("../../avatar/Avatar");
var Settings = require("./Settings");


var SettingsMenu = {

    update: function() {
        var newDisplayName = Util.escapeHtml($('#setDisplayName').get(0).value);
        var newEmail = Util.escapeHtml($('#setEmail').get(0).value);

        if(newDisplayName) {
            var displayName = Settings.setDisplayName(newDisplayName);
            xmpp.addToPresence("displayName", displayName, true);
        }


        xmpp.addToPresence("email", newEmail);
        var email = Settings.setEmail(newEmail);


        Avatar.setUserAvatar(xmpp.myJid(), email);
    },

    isVisible: function() {
        return $('#settingsmenu').is(':visible');
    },

    setDisplayName: function(newDisplayName) {
        var displayName = Settings.setDisplayName(newDisplayName);
        $('#setDisplayName').get(0).value = displayName;
    },

    onDisplayNameChange: function(peerJid, newDisplayName) {
        if(peerJid === 'localVideoContainer' ||
            peerJid === xmpp.myJid()) {
            this.setDisplayName(newDisplayName);
        }
    }
};


module.exports = SettingsMenu;