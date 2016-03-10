/* global APP, $ */
import UIUtil from "../../util/UIUtil";
import UIEvents from "../../../../service/UI/UIEvents";
import languages from "../../../../service/translation/languages";
import Settings from '../../../settings/Settings';

/**
 * Generate html select options for available languages.
 * @param {string[]} items available languages
 * @param {string} [currentLang] current language
 * @returns {string}
 */
function generateLanguagesOptions(items, currentLang) {
    return items.map(function (lang) {
        let attrs = {
            value: lang,
            'data-i18n': `languages:${lang}`
        };

        if (lang === currentLang) {
            attrs.selected = 'selected';
        }

        let attrsStr = UIUtil.attrsToString(attrs);
        return `<option ${attrsStr}></option>`;
    }).join('\n');
}

/**
 * Generate html select options for available physical devices.
 * @param {{ deviceId, label }[]} items available devices
 * @param {string} [selectedId] id of selected device
 * @returns {string}
 */
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

        // DISPLAY NAME
        function updateDisplayName () {
            emitter.emit(UIEvents.NICKNAME_CHANGED, $('#setDisplayName').val());
        }
        $('#setDisplayName')
            .val(Settings.getDisplayName())
            .keyup(function (event) {
                if (event.keyCode === 13) { // enter
                    updateDisplayName();
                }
            })
            .focusout(updateDisplayName);


        // EMAIL
        function updateEmail () {
            emitter.emit(UIEvents.EMAIL_CHANGED, $('#setEmail').val());
        }
        $('#setEmail')
            .val(Settings.getEmail())
            .keyup(function (event) {
            if (event.keyCode === 13) { // enter
                updateEmail();
            }
        }).focusout(updateEmail);


        // START MUTED
        $("#startMutedOptions").change(function () {
            let startAudioMuted = $("#startAudioMuted").is(":checked");
            let startVideoMuted = $("#startVideoMuted").is(":checked");
            emitter.emit(
                UIEvents.START_MUTED_CHANGED,
                startAudioMuted,
                startVideoMuted
            );
        });


        // LANGUAGES BOX
        let languagesBox = $("#languages_selectbox");
        languagesBox.html(generateLanguagesOptions(
            languages.getLanguages(),
            APP.translation.getCurrentLanguage()
        ));
        APP.translation.translateElement(languagesBox);
        languagesBox.change(function () {
            emitter.emit(UIEvents.LANG_CHANGED, languagesBox.val());
        });


        // DEVICES LIST
        this.changeDevicesList([]);
        $('#selectCamera').change(function () {
            let cameraDeviceId = $(this).val();
            if (cameraDeviceId !== Settings.getCameraDeviceId()) {
                emitter.emit(UIEvents.VIDEO_DEVICE_CHANGED, cameraDeviceId);
            }
        });
        $('#selectMic').change(function () {
            let micDeviceId = $(this).val();
            if (micDeviceId !== Settings.getMicDeviceId()) {
                emitter.emit(UIEvents.AUDIO_DEVICE_CHANGED, micDeviceId);
            }
        });
    },

    /**
     * If start audio muted/start video muted options should be visible or not.
     * @param {boolean} show
     */
    showStartMutedOptions (show) {
        if (show) {
            $("#startMutedOptions").css("display", "block");
        } else {
            $("#startMutedOptions").css("display", "none");
        }
    },

    updateStartMutedBox (startAudioMuted, startVideoMuted) {
        $("#startAudioMuted").attr("checked", startAudioMuted);
        $("#startVideoMuted").attr("checked", startVideoMuted);
    },

    /**
     * Check if settings menu is visible or not.
     * @returns {boolean}
     */
    isVisible () {
        return $('#settingsmenu').is(':visible');
    },

    /**
     * Change user display name in the settings menu.
     * @param {string} newDisplayName
     */
    changeDisplayName (newDisplayName) {
        $('#setDisplayName').val(newDisplayName);
    },

    /**
     * Change user avatar in the settings menu.
     * @param {string} avatarUrl url of the new avatar
     */
    changeAvatar (avatarUrl) {
        $('#avatar').attr('src', avatarUrl);
    },

    /**
     * Change available cameras/microphones or hide selects completely if
     * no devices available.
     * @param {{ deviceId, label, kind }[]} devices list of available devices
     */
    changeDevicesList (devices) {
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
