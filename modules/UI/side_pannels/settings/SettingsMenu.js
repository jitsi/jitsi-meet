/* global APP, $ */
import UIUtil from "../../util/UIUtil";
import UIEvents from "../../../../service/UI/UIEvents";
import languages from "../../../../service/translation/languages";

function generateLanguagesSelectBox() {
    var currentLang = APP.translation.getCurrentLanguage();
    var html = '<select id="languages_selectbox">';
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


const SettingsMenu = {

    init: function (emitter) {
        this.emitter = emitter;

        var startMutedSelector = $("#startMutedOptions");
        startMutedSelector.before(generateLanguagesSelectBox());
        APP.translation.translateElement($("#languages_selectbox"));
        $('#settingsmenu>input').keyup(function(event){
            if(event.keyCode === 13) {//enter
                SettingsMenu.update();
            }
        });

        if (APP.conference.isModerator) {
            startMutedSelector.css("display", "block");
        } else {
            startMutedSelector.css("display", "none");
        }

        $("#updateSettings").click(function () {
            SettingsMenu.update();
        });
    },

    onRoleChanged: function () {
        if(APP.conference.isModerator) {
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
        // FIXME check if this values really changed:
        // compare them with Settings etc.
        var newDisplayName =
                UIUtil.escapeHtml($('#setDisplayName').get(0).value);

        if (newDisplayName) {
            this.emitter.emit(UIEvents.NICKNAME_CHANGED, newDisplayName);
        }

        var language = $("#languages_selectbox").val();
        this.emitter.emit(UIEvents.LANG_CHANGED, language);

        var newEmail = UIUtil.escapeHtml($('#setEmail').get(0).value);
        this.emitter.emit(UIEvents.EMAIL_CHANGED, newEmail);

        var startAudioMuted = ($("#startAudioMuted").is(":checked"));
        var startVideoMuted = ($("#startVideoMuted").is(":checked"));
        this.emitter.emit(
            UIEvents.START_MUTED_CHANGED, startAudioMuted, startVideoMuted
        );
    },

    isVisible: function() {
        return $('#settingsmenu').is(':visible');
    },

    onDisplayNameChange: function(id, newDisplayName) {
        if(id === 'localVideoContainer' || APP.conference.isLocalId(id)) {
            $('#setDisplayName').get(0).value = newDisplayName;
        }
    },
    changeAvatar: function (thumbUrl) {
        $('#avatar').get(0).src = thumbUrl;
    }
};

export default SettingsMenu;
