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

function generateDevicesOptions(items, selectedId) {
    return items.map(function (item) {
        let attrs = {
            value: item.deviceId
        };

        if (item.deviceId === selectedId) {
            attrs.selected = 'selected';
        }

        let attrsStr = UIUtil.attrsToString(attrs);
        return `<option ${attrsStr}>${item.label}</option>`;
    }).join('\n');
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

            let cameraDeviceId = $('#selectCamera').val();
            if (cameraDeviceId !== Settings.getCameraDeviceId()) {
                emitter.emit(UIEvents.VIDEO_DEVICE_CHANGED, cameraDeviceId);
            }

            let micDeviceId = $('#selectMic').val();
            if (micDeviceId !== Settings.getMicDeviceId()) {
                emitter.emit(UIEvents.AUDIO_DEVICE_CHANGED, micDeviceId);
            }
        }

        let startMutedBlock = $("#startMutedOptions");
        startMutedBlock.before(generateLanguagesSelectBox());
        APP.translation.translateElement($("#languages_selectbox"));

        this.onAvailableDevicesChanged();
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
    },

    onAvailableDevicesChanged () {
        let devices = APP.conference.availableDevices;
        if (!devices.length) {
            $('#devicesOptions').hide();
            return;
        }

        let audio = devices.filter(device => device.kind === 'audioinput');
        let video = devices.filter(device => device.kind === 'videoinput');

        $('#selectCamera').html(
            generateDevicesOptions(video, Settings.getCameraDeviceId())
        );
        $('#selectMic').html(
            generateDevicesOptions(audio, Settings.getMicDeviceId())
        );

        $('#devicesOptions').show();
    }
};
