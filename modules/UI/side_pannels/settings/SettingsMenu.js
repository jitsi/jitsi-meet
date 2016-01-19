/* global APP, $ */
import UIUtil from "../../util/UIUtil";
import UIEvents from "../../../../service/UI/UIEvents";
import languages from "../../../../service/translation/languages";
import Settings from '../../../settings/Settings';

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


export default {
    init (emitter) {
        function update() {
            let displayName = UIUtil.escapeHtml($('#setDisplayName').val());

            if (displayName && Settings.getDisplayName() !== displayName) {
                emitter.emit(UIEvents.NICKNAME_CHANGED, displayName);
            }

            let language = $("#languages_selectbox").val();
            if (language !== Settings.getLanguage()) {
                emitter.emit(UIEvents.LANG_CHANGED, language);
            }

            let email = UIUtil.escapeHtml($('#setEmail').val());
            if (email !== Settings.getEmail()) {
                emitter.emit(UIEvents.EMAIL_CHANGED, email);
            }

            let startAudioMuted = $("#startAudioMuted").is(":checked");
            let startVideoMuted = $("#startVideoMuted").is(":checked");
            if (startAudioMuted !== APP.conference.startAudioMuted
                || startVideoMuted !== APP.conference.startVideoMuted) {
                emitter.emit(
                    UIEvents.START_MUTED_CHANGED,
                    startAudioMuted,
                    startVideoMuted
                );
            }
        }

        let startMutedBlock = $("#startMutedOptions");
        startMutedBlock.before(generateLanguagesSelectBox());
        APP.translation.translateElement($("#languages_selectbox"));

        this.onRoleChanged();
        this.onStartMutedChanged();

        $("#updateSettings").click(update);
        $('#settingsmenu>input').keyup(function(event){
            if (event.keyCode === 13) {//enter
                update();
            }
        });
    },

    onRoleChanged () {
        if(APP.conference.isModerator) {
            $("#startMutedOptions").css("display", "block");
        }
        else {
            $("#startMutedOptions").css("display", "none");
        }
    },

    onStartMutedChanged () {
        $("#startAudioMuted").attr("checked", APP.conference.startAudioMuted);
        $("#startVideoMuted").attr("checked", APP.conference.startVideoMuted);
    },

    isVisible () {
        return $('#settingsmenu').is(':visible');
    },

    onDisplayNameChange (id, newDisplayName) {
        if(id === 'localVideoContainer' || APP.conference.isLocalId(id)) {
            $('#setDisplayName').val(newDisplayName);
        }
    },

    changeAvatar (avatarUrl) {
        $('#avatar').attr('src', avatarUrl);
    }
};
