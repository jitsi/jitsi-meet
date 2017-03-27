/* global $, APP, AJS, interfaceConfig, JitsiMeetJS */

import { LANGUAGES } from "../../../../react/features/base/i18n";

import UIUtil from "../../util/UIUtil";
import UIEvents from "../../../../service/UI/UIEvents";
import Settings from '../../../settings/Settings';

const sidePanelsContainerId = 'sideToolbarContainer';
const htmlStr = `
    <div id="settings_container" class="sideToolbarContainer__inner">
        <div class="title" data-i18n="settings.title"></div>
        <form class="aui">
            <div id="languagesSelectWrapper" 
                class="sideToolbarBlock first hide">
                <select id="languagesSelect"></select>
            </div>
            <div id="deviceOptionsWrapper" class="hide">
                <div id="deviceOptionsTitle" class="subTitle hide" 
                    data-i18n="settings.audioVideo"></div>
                <div class="sideToolbarBlock first">
                    <label class="first" data-i18n="settings.selectCamera">
                    </label>
                    <select id="selectCamera"></select>
                </div>
                <div class="sideToolbarBlock">
                    <label data-i18n="settings.selectMic"></label>
                    <select id="selectMic"></select>
                </div>
                <div class="sideToolbarBlock">
                    <label data-i18n="settings.selectAudioOutput"></label>
                    <select id="selectAudioOutput"></select>
                </div>
            </div>
            <div id="moderatorOptionsWrapper" class="hide">
                <div id="moderatorOptionsTitle" class="subTitle hide" 
                    data-i18n="settings.moderator"></div>
                <div id="startMutedOptions" class="hide">
                    <div class="sideToolbarBlock first">
                        <input type="checkbox" id="startAudioMuted">
                        <label class="startMutedLabel" for="startAudioMuted" 
                            data-i18n="settings.startAudioMuted"></label>
                    </div>
                    <div class="sideToolbarBlock">
                        <input type="checkbox" id="startVideoMuted">
                        <label class="startMutedLabel" for="startVideoMuted" 
                            data-i18n="settings.startVideoMuted"></label>
                    </div>
                </div>
                <div id="followMeOptions" class="hide">
                    <div class="sideToolbarBlock">
                        <input type="checkbox" id="followMeCheckBox">
                        <label class="followMeLabel" for="followMeCheckBox" 
                            data-i18n="settings.followMe"></label>
                    </div>
                </div>
            </div>
        </form>
    </div>`;

function initHTML() {
    $(`#${sidePanelsContainerId}`)
        .append(htmlStr);
    // make sure we translate the panel, as adding it can be after i18n
    // library had initialized and translated already present html
    APP.translation.translateElement($(`#${sidePanelsContainerId}`));
}

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
    }).join('');
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

/**
 * Replace html select element to select2 custom dropdown
 *
 * @param {jQueryElement} $el native select element
 * @param {function} onSelectedCb fired if item is selected
 */
function initSelect2($el, onSelectedCb) {
    $el.auiSelect2({
        minimumResultsForSearch: Infinity
    });
    if (typeof onSelectedCb === 'function') {
        $el.change(onSelectedCb);
    }
}

export default {
    init (emitter) {
        initHTML();
        //LANGUAGES BOX
        if (UIUtil.isSettingEnabled('language')) {
            const wrapperId = 'languagesSelectWrapper';
            const selectId = 'languagesSelect';
            const selectEl = AJS.$(`#${selectId}`);
            let selectInput;

            selectEl.html(generateLanguagesOptions(
                LANGUAGES,
                APP.translation.getCurrentLanguage()
            ));
            initSelect2(selectEl, () => {
                const val = selectEl.val();

                selectInput[0].dataset.i18n = `languages:${val}`;
                APP.translation.translateElement(selectInput);
                emitter.emit(UIEvents.LANG_CHANGED, val);
            });
            //find new selectInput element
            selectInput = $(`#s2id_${selectId} .select2-chosen`);
            //first select fix for languages options
            selectInput[0].dataset.i18n =
                `languages:${APP.translation.getCurrentLanguage()}`;

            // translate selectInput, which is the currently selected language
            // otherwise there will be no selected option
            APP.translation.translateElement(selectInput);
            APP.translation.translateElement(selectEl);

            APP.translation.addLanguageChangedListener(
                lng => selectInput[0].dataset.i18n = `languages:${lng}`);

            UIUtil.setVisible(wrapperId, true);
        }
        // DEVICES LIST
        if (UIUtil.isSettingEnabled('devices')) {
            const wrapperId = 'deviceOptionsWrapper';

            JitsiMeetJS.mediaDevices.isDeviceListAvailable()
                .then((isDeviceListAvailable) => {
                    if (isDeviceListAvailable &&
                        JitsiMeetJS.mediaDevices.isDeviceChangeAvailable()) {
                        this._initializeDeviceSelectionSettings(emitter);
                    }
                });
            // Only show the subtitle if this isn't the only setting section.
            if (interfaceConfig.SETTINGS_SECTIONS.length > 1)
                UIUtil.setVisible("deviceOptionsTitle", true);

            UIUtil.setVisible(wrapperId, true);
        }
        // MODERATOR
        if (UIUtil.isSettingEnabled('moderator')) {
            const wrapperId = 'moderatorOptionsWrapper';

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
            const followMeToggle = document.getElementById('followMeCheckBox');
            followMeToggle.addEventListener('change', () => {
                const isFollowMeEnabled = followMeToggle.checked;
                emitter.emit(UIEvents.FOLLOW_ME_ENABLED, isFollowMeEnabled);
            });

            UIUtil.setVisible(wrapperId, true);
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
            if (!$("#moderatorOptionsTitle").is(":visible")
                    && interfaceConfig.SETTINGS_SECTIONS.length > 1)
                UIUtil.setVisible("moderatorOptionsTitle", true);

            UIUtil.setVisible("startMutedOptions", true);
        } else {
            // Only show the subtitle if this isn't the only setting section.
            if ($("#moderatorOptionsTitle").is(":visible"))
                UIUtil.setVisible("moderatorOptionsTitle", false);

            UIUtil.setVisible("startMutedOptions", false);
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
        UIUtil.setVisible(
            "followMeOptions",
            show && UIUtil.isSettingEnabled('moderator'));
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
        let $selectCamera= AJS.$('#selectCamera'),
            $selectMic = AJS.$('#selectMic'),
            $selectAudioOutput = AJS.$('#selectAudioOutput'),
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

        initSelect2($selectCamera);

        $selectMic
            .html(generateDevicesOptions(
                audio,
                selectedAudioDevice ? selectedAudioDevice.deviceId : '',
                audioPermissionGranted))
            .prop('disabled', !audio.length || !audioPermissionGranted);

        initSelect2($selectMic);

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
            initSelect2($selectAudioOutput);

            $selectAudioOutputParent.show();
        } else {
            $selectAudioOutputParent.hide();
        }

        APP.translation.translateElement($('#settings_container option'));
    }
};
