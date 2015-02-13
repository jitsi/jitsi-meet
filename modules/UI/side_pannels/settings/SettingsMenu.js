var Avatar = require("../../avatar/Avatar");
var Settings = require("./../../../settings/Settings");
var UIUtil = require("../../util/UIUtil");
var languages = require("../../../../service/translation/languages");

function generateLanguagesSelectBox()
{
    var currentLang = APP.translation.getCurrentLanguage();
    var html = "<select id=\"languages_selectbox\">";
    var langArray = languages.getLanguages();
    for(var i = 0; i < langArray.length; i++)
    {
        var lang = langArray[i];
        html += "<option ";
        if(lang === currentLang)
            html += "selected ";
        html += "value=\"" + lang + "\" data-i18n='languages:" + lang + "'>";
        html += "</option>";

    }

    return html + "</select>";
}


var SettingsMenu = {

    init: function () {
        $("#updateSettings").before(generateLanguagesSelectBox());
        $('#settingsmenu>input').keyup(function(event){
            if(event.keyCode === 13) {//enter
                SettingsMenu.update();
            }
        });

        $("#updateSettings").click(function () {
            SettingsMenu.update();
        });
    },

    update: function() {
        var newDisplayName = UIUtil.escapeHtml($('#setDisplayName').get(0).value);
        var newEmail = UIUtil.escapeHtml($('#setEmail').get(0).value);

        if(newDisplayName) {
            var displayName = Settings.setDisplayName(newDisplayName);
            APP.xmpp.addToPresence("displayName", displayName, true);
        }

        APP.translation.setLanguage($("#languages_selectbox").val());

        APP.xmpp.addToPresence("email", newEmail);
        var email = Settings.setEmail(newEmail);


        Avatar.setUserAvatar(APP.xmpp.myJid(), email);
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
            peerJid === APP.xmpp.myJid()) {
            this.setDisplayName(newDisplayName);
        }
    }
};


module.exports = SettingsMenu;