var Avatar = require("../../avatar/Avatar");
var Settings = require("./Settings");


var SettingsMenu = {

    update: function() {
        var newDisplayName = Util.escapeHtml($('#setDisplayName').get(0).value);
        var newEmail = Util.escapeHtml($('#setEmail').get(0).value);

        if(newDisplayName) {
            var displayName = Settings.setDisplayName(newDisplayName);
            connection.emuc.addDisplayNameToPresence(displayName);
        }


        connection.emuc.addEmailToPresence(newEmail);
        var email = Settings.setEmail(newEmail);


        connection.emuc.sendPresence();
        Avatar.setUserAvatar(connection.emuc.myroomjid, email);
    },

    isVisible: function() {
        return $('#settingsmenu').is(':visible');
    },

    setDisplayName: function(newDisplayName) {
        var displayName = Settings.setDisplayName(newDisplayName);
        $('#setDisplayName').get(0).value = displayName;
    }
};

$(document).bind('displaynamechanged', function(event, peerJid, newDisplayName) {
    if(peerJid === 'localVideoContainer' ||
        peerJid === connection.emuc.myroomjid) {
        SettingsMenu.setDisplayName(newDisplayName);
    }
});

module.exports = SettingsMenu;