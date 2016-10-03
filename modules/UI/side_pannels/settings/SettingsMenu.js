/* global APP, $, JitsiMeetJS */
import UIUtil from "../../util/UIUtil";
import UIEvents from "../../../../service/UI/UIEvents";
import languages from "../../../../service/translation/languages";
import Settings from '../../../settings/Settings';

/**
 * Generate html select options for available languages.
 *
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
 *
 * @param {{ deviceId, label }[]} items available devices
 * @param {string} [selectedId] id of selected device
 * @param {boolean} permissionGranted if permission to use selected device type
 *      is granted
 * @returns {string}
 */
function generateDevicesOptions(items, selectedId, permissionGranted) {
    if (!permissionGranted && items.length) {
        return '<option data-i18n="settings.noPermission"></option>';
    }

    var options = items.map(function (item) {
        let attrs = {
            value: item.deviceId
        };

        if (item.deviceId === selectedId) {
            attrs.selected = 'selected';
        }

        let attrsStr = UIUtil.attrsToString(attrs);
        return `<option ${attrsStr}>${item.label}</option>`;
    });

    if (!items.length) {
        options.unshift('<option data-i18n="settings.noDevice"></option>');
    }

    return options.join('');
}


export default {
    init (emitter) {
        if (UIUtil.isSettingEnabled('devices')) {
            // DEVICES LIST
            JitsiMeetJS.mediaDevices.isDeviceListAvailable()
                .then((isDeviceListAvailable) => {
                    if (isDeviceListAvailable &&
                        JitsiMeetJS.mediaDevices.isDeviceChangeAvailable()) {
                        this._initializeDeviceSelectionSettings(emitter);
                    }
                });

            UIUtil.showElement("deviceOptionsTitle");
            UIUtil.showElement("devicesOptions");
        }

        if (UIUtil.isSettingEnabled('language')) {
            //LANGUAGES BOX
            let languagesBox = $("#languages_selectbox");
            languagesBox.html(generateLanguagesOptions(
                languages.getLanguages(),
                APP.translation.getCurrentLanguage()
            ));
            APP.translation.translateElement(languagesBox);
            languagesBox.change(function () {
                emitter.emit(UIEvents.LANG_CHANGED, languagesBox.val());
            });

            UIUtil.showElement("languages_selectbox");
        }

        if (UIUtil.isSettingEnabled('moderator')) {
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

            // FOLLOW ME
            $("#followMeOptions").change(function () {
                let isFollowMeEnabled = $("#followMeCheckBox").is(":checked");
                emitter.emit(
                    UIEvents.FOLLOW_ME_ENABLED,
                    isFollowMeEnabled
                );
            });
        }
    },

    _initializeDeviceSelectionSettings(emitter) {
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
        $('#selectAudioOutput').change(function () {
            let audioOutputDeviceId = $(this).val();
            if (audioOutputDeviceId !== Settings.getAudioOutputDeviceId()) {
                emitter.emit(
                    UIEvents.AUDIO_OUTPUT_DEVICE_CHANGED, audioOutputDeviceId);
            }
        });
    },

    /**
     * If start audio muted/start video muted options should be visible or not.
     * @param {boolean} show
     */
    showStartMutedOptions (show) {
        if (show && UIUtil.isSettingEnabled('moderator')) {
            // Only show the subtitle if this isn't the only setting section.
            if (!$("#moderatorOptionsTitle").is(":visible"))
                UIUtil.showElement("moderatorOptionsTitle");

            UIUtil.showElement("startMutedOptions");
        } else {
            // Only show the subtitle if this isn't the only setting section.
            if ($("#moderatorOptionsTitle").is(":visible"))
                UIUtil.hideElement("moderatorOptionsTitle");

            UIUtil.hideElement("startMutedOptions");
        }
    },

    updateStartMutedBox (startAudioMuted, startVideoMuted) {
        $("#startAudioMuted").attr("checked", startAudioMuted);
        $("#startVideoMuted").attr("checked", startVideoMuted);
    },

    /**
     * Shows/hides the follow me options in the settings dialog.
     *
     * @param {boolean} show {true} to show those options, {false} to hide them
     */
    showFollowMeOptions (show) {
        if (show && UIUtil.isSettingEnabled('moderator')) {
            UIUtil.showElement("followMeOptions");
        } else {
            UIUtil.hideElement("followMeOptions");
        }
    },

    /**
     * Check if settings menu is visible or not.
     * @returns {boolean}
     */
    isVisible () {
        return UIUtil.isVisible(document.getElementById("settings_container"));
    },

    /**
     * Sets microphone's <select> element to select microphone ID from settings.
     */
    setSelectedMicFromSettings () {
        $('#selectMic').val(Settings.getMicDeviceId());
    },

    /**
     * Sets camera's <select> element to select camera ID from settings.
     */
    setSelectedCameraFromSettings () {
        $('#selectCamera').val(Settings.getCameraDeviceId());
    },

    /**
     * Sets audio outputs's <select> element to select audio output ID from
     * settings.
     */
    setSelectedAudioOutputFromSettings () {
        $('#selectAudioOutput').val(Settings.getAudioOutputDeviceId());
    },

    /**
     * Change available cameras/microphones or hide selects completely if
     * no devices available.
     * @param {{ deviceId, label, kind }[]} devices list of available devices
     */
    changeDevicesList (devices) {
        let $selectCamera= $('#selectCamera'),
            $selectMic = $('#selectMic'),
            $selectAudioOutput = $('#selectAudioOutput'),
            $selectAudioOutputParent = $selectAudioOutput.parent();

        let audio = devices.filter(device => device.kind === 'audioinput'),
            video = devices.filter(device => device.kind === 'videoinput'),
            audioOutput = devices
                .filter(device => device.kind === 'audiooutput'),
            selectedAudioDevice = audio.find(
                d => d.deviceId === Settings.getMicDeviceId()) || audio[0],
            selectedVideoDevice = video.find(
                d => d.deviceId === Settings.getCameraDeviceId()) || video[0],
            selectedAudioOutputDevice = audioOutput.find(
                    d => d.deviceId === Settings.getAudioOutputDeviceId()),
            videoPermissionGranted =
                JitsiMeetJS.mediaDevices.isDevicePermissionGranted('video'),
            audioPermissionGranted =
                JitsiMeetJS.mediaDevices.isDevicePermissionGranted('audio');

        $selectCamera
            .html(generateDevicesOptions(
                video,
                selectedVideoDevice ? selectedVideoDevice.deviceId : '',
                videoPermissionGranted))
            .prop('disabled', !video.length || !videoPermissionGranted);

        $selectMic
            .html(generateDevicesOptions(
                audio,
                selectedAudioDevice ? selectedAudioDevice.deviceId : '',
                audioPermissionGranted))
            .prop('disabled', !audio.length || !audioPermissionGranted);

        if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
            $selectAudioOutput
                .html(generateDevicesOptions(
                    audioOutput,
                    selectedAudioOutputDevice
                        ? selectedAudioOutputDevice.deviceId
                        : 'default',
                    videoPermissionGranted || audioPermissionGranted))
                .prop('disabled', !audioOutput.length ||
                    (!videoPermissionGranted && !audioPermissionGranted));

            $selectAudioOutputParent.show();
        } else {
            $selectAudioOutputParent.hide();
        }

        $('#devicesOptions').show();

        APP.translation.translateElement($('#settings_container option'));
    }
};
