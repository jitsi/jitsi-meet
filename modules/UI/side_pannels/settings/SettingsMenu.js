/* global APP, $ */
var Avatar = require("../../avatar/Avatar");
var Settings = require("./../../../settings/Settings");
var UIUtil = require("../../util/UIUtil");
var languages = require("../../../../service/translation/languages");
var RTC = require('../../../RTC/RTC');

function generateLanguagesSelectBox() {
    var currentLang = APP.translation.getCurrentLanguage();
    var html = "<select id=\"languages_selectbox\">";
    var langArray = languages.getLanguages();
    for(var i = 0; i < langArray.length; i++) {
        var lang = langArray[i];
        html += "<option ";
        if(lang === currentLang)
            html += "selected ";
        html += "value=\"" + lang + "\" data-i18n='languages:" + lang + "'>";
        html += "</option>";

    }

    return html + "</select>";
}

function generateDevicesOptions(items, selectedId) {
    var html = '';

    items.forEach(function (item) {
        var attrs = {
            value: item.deviceId
        };
        if (item.deviceId === selectedId) {
            attrs.selected = 'selected';
        }
        html += '<option ' + UIUtil.attrsToString(attrs) + '>'
            + item.label
            + '</option>\n';
    });

    return html;
}

var SettingsMenu = {

    init: function () {
        var startMutedSelector = $("#startMutedOptions");
        startMutedSelector.before(generateLanguagesSelectBox());
        APP.translation.translateElement($("#languages_selectbox"));
        $('#settingsmenu>input').keyup(function(event){
            if(event.keyCode === 13) {//enter
                SettingsMenu.update();
            }
        });

        RTC.enumerateDevices(function (devices) {
          var audio = devices.filter(function (device) {
            return device.kind === 'audioinput';
          });
          var video = devices.filter(function (device) {
            return device.kind === 'videoinput';
          });

          $('#selectCamera').html(
            generateDevicesOptions(video, Settings.getCameraDeviceId())
          );
          $('#selectMic').html(
            generateDevicesOptions(audio, Settings.getMicDeviceId())
          );
        });

        if (APP.xmpp.isModerator()) {
            startMutedSelector.css("display", "block");
        }
        else {
            startMutedSelector.css("display", "none");
        }

        $("#updateSettings").click(function () {
            SettingsMenu.update();
        });
    },

    onRoleChanged: function () {
        if(APP.xmpp.isModerator()) {
            $("#startMutedOptions").css("display", "block");
        }
        else {
            $("#startMutedOptions").css("display", "none");
        }
    },

    setStartMuted: function (audio, video) {
        $("#startAudioMuted").attr("checked", audio);
        $("#startVideoMuted").attr("checked", video);
    },

    update: function() {
        var newDisplayName =
            UIUtil.escapeHtml($('#setDisplayName').get(0).value);
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


        var cameraDeviceId = $('#selectCamera').val();
        var micDeviceId = $('#selectMic').val();

        var deviceChanged = false;

        if (cameraDeviceId !== Settings.getCameraDeviceId()) {
            deviceChanged = true;
            Settings.setCameraDeviceId(cameraDeviceId);
        }
        if (micDeviceId !== Settings.getMicDeviceId()) {
            deviceChanged = true;
            Settings.setMicDeviceId(micDeviceId);
        }

        if (deviceChanged) {
            //FIXME do something
        }

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
    },
    changeAvatar: function (thumbUrl) {
        $('#avatar').get(0).src = thumbUrl;
    }
};


module.exports = SettingsMenu;