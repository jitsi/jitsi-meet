/*
 * Copyright @ 2015 Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
        $("#startMutedOptions").before(generateLanguagesSelectBox());
        APP.translation.translateElement($("#languages_selectbox"));
        $('#settingsmenu>input').keyup(function(event){
            if(event.keyCode === 13) {//enter
                SettingsMenu.update();
            }
        });

        if(APP.xmpp.isModerator())
        {
            $("#startMutedOptions").css("display", "block");
        }
        else
        {
            $("#startMutedOptions").css("display", "none");
        }

        $("#updateSettings").click(function () {
            SettingsMenu.update();
        });
    },

    onRoleChanged: function () {
        if(APP.xmpp.isModerator())
        {
            $("#startMutedOptions").css("display", "block");
        }
        else
        {
            $("#startMutedOptions").css("display", "none");
        }
    },

    setStartMuted: function (audio, video) {
        $("#startAudioMuted").attr("checked", audio);
        $("#startVideoMuted").attr("checked", video);
    },

    update: function() {
        var newDisplayName = UIUtil.escapeHtml($('#setDisplayName').get(0).value);
        var newEmail = UIUtil.escapeHtml($('#setEmail').get(0).value);

        if(newDisplayName) {
            var displayName = Settings.setDisplayName(newDisplayName);
            APP.xmpp.addToPresence("displayName", displayName, true);
        }

        var language = $("#languages_selectbox").val();
        APP.translation.setLanguage(language);
        Settings.setLanguage(language);

        APP.xmpp.addToPresence("email", newEmail);
        var email = Settings.setEmail(newEmail);

        var startAudioMuted = ($("#startAudioMuted").is(":checked"));
        var startVideoMuted = ($("#startVideoMuted").is(":checked"));
        APP.xmpp.addToPresence("startMuted",
            [startAudioMuted, startVideoMuted]);

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