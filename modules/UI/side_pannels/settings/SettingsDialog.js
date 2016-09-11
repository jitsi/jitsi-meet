/* global APP, $, JitsiMeetJS */
import UIUtil from "../../util/UIUtil";
import UIEvents from "../../../../service/UI/UIEvents";
import languages from "../../../../service/translation/languages";
import Settings from '../../../settings/Settings';
import mediaDeviceHelper from '../../../devices/mediaDeviceHelper';

const RTCUIUtils = JitsiMeetJS.util.RTCUIHelper;

var constructAudioIndicatorHtml = function() {
    return '<span>'
            + '<span id="audioLevel0" class="audioLevelDot"></span>'
            + '<span id="audioLevel1" class="audioLevelDot"></span>'
            + '<span id="audioLevel2" class="audioLevelDot"></span>'
            + '<span id="audioLevel3" class="audioLevelDot"></span>'
            + '<span id="audioLevel4" class="audioLevelDot"></span>'
            + '<span id="audioLevel5" class="audioLevelDot"></span>'
            + '<span id="audioLevel6" class="audioLevelDot"></span>'
            + '<span id="audioLevel7" class="audioLevelDot"></span>'
            + '<span id="audioLevel8" class="audioLevelDot"></span>'
            + '<span id="audioLevel9" class="audioLevelDot"></span>'
            + '</span>';
};

var constructMediaSettingsHtml = function() {
    return '<div class="settingsContent">'
            + '<video id="localVideoPreview"></video>'
            //+ constructAudioIndicatorHtml()
            + '<div class="deviceSelection">'
                + '<span class="device">'
                    + '<select id="selectCamera"></select> '
                + '</span>'
                + '<span class="device">'
                    + '<select id="selectMic"></select> '
                + '</span>'
                + '<span class="device">'
                    + '<select id="selectAudioOutput"></select> '
                + '</span>'
            + '</div>'
        + '</div>';
};

/**
 * The callback function corresponding to the openSettingsWindow parameter.
 *
 * @type {function}
 */
var settingsWindowCallback = null;

/**
 * Defines all methods in connection to the Settings dialog.
 */
var SettingsDialog = {
    init(eventEmitter) {
        this.eventEmitter = eventEmitter;
    },

    /**
     * Generate html select options for available physical devices.
     * @param {{ deviceId, label }[]} items available devices
     * @param {string} [selectedId] id of selected device
     * @param {boolean} permissionGranted if permission to use selected device
     * type is granted
     * @returns {string}
     */
    _generateDevicesOptions(items, selectedId, permissionGranted) {
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
    },

    _onLoadMediaSettings() {
        let localVideoPreview = document.getElementById("localVideoPreview");
        RTCUIUtils.setAutoPlay(localVideoPreview, true);
        RTCUIUtils.setVolume(localVideoPreview, 0);

        let localVideo = APP.conference.getVideoStream();
        if (localVideo)
            localVideoPreview = localVideo.attach(localVideoPreview);

        this.eventEmitter.addListener(UIEvents.VIDEO_STREAM_CHANGED,
            function(newStream)
            {
                newStream.attach(localVideoPreview);
            });

        // DEVICES LIST
        JitsiMeetJS.mediaDevices.isDeviceListAvailable()
            .then((isDeviceListAvailable) => {
                if (isDeviceListAvailable &&
                    JitsiMeetJS.mediaDevices.isDeviceChangeAvailable()) {

                    this._initializeDeviceSelectionSettings();
                }
            });

        APP.UI.eventEmitter.addListener(UIEvents.DEVICE_LIST_CHANGED,
            (devices) => {
                this._changeDevicesList(devices);
            });
    },

    /**
     * Initializes the device list with the current available media devices
     * and attaches all listeners needed for device change user
     * event handling.
     */
    _initializeDeviceSelectionSettings() {
        this._changeDevicesList(mediaDeviceHelper.getCurrentMediaDevices());

        $('#selectCamera').change(function () {
            let cameraDeviceId = $(this).val();
                if (cameraDeviceId !== Settings.getCameraDeviceId()) {
                this.eventEmitter
                    .emit(UIEvents.VIDEO_DEVICE_CHANGED, cameraDeviceId);
            }
        });
        $('#selectMic').change(function () {
            let micDeviceId = $(this).val();
            if (micDeviceId !== Settings.getMicDeviceId()) {
                this.eventEmitter
                    .emit(UIEvents.AUDIO_DEVICE_CHANGED, micDeviceId);
            }
        });
        $('#selectAudioOutput').change(function () {
            let audioOutputDeviceId = $(this).val();
            if (audioOutputDeviceId !== Settings.getAudioOutputDeviceId()) {
                this.eventEmitter.emit(
                    UIEvents.AUDIO_OUTPUT_DEVICE_CHANGED, audioOutputDeviceId);
            }
        });
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
    _changeDevicesList (devices) {
        let $selectCamera= $('#selectCamera'),
            $selectMic = $('#selectMic'),
            $selectAudioOutput = $('#selectAudioOutput'),
            $selectAudioOutputParent = $selectAudioOutput.parent();

        let audio = devices.audioinput,
            video = devices.videoinput,
            audioOutput = devices.audiooutput,
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
            .html(this._generateDevicesOptions(
                video,
                selectedVideoDevice ? selectedVideoDevice.deviceId : '',
                videoPermissionGranted))
            .prop('disabled', !video.length || !videoPermissionGranted);

        $selectMic
            .html(this._generateDevicesOptions(
                audio,
                selectedAudioDevice ? selectedAudioDevice.deviceId : '',
                audioPermissionGranted))
            .prop('disabled', !audio.length || !audioPermissionGranted);

        if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
            $selectAudioOutput
                .html(this._generateDevicesOptions(
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
    },

    /**
     * Opens the feedback window.
     */
    openSettingsDialog: function (callback) {
        settingsWindowCallback = callback;

        var htmlString = '<div class="settingsDialog">'
                            + constructMediaSettingsHtml()
                            + '</div>';

        // Defines the different states of the feedback window.
        var states = {
            mediaSettings: {
                title: APP.translation.translateString("settings.title"),
                html: htmlString,
                persistent: false,
                buttons: {},
                closeText: '',
                //focus: "div[id='stars']",
                position: {width: 600}
            }
        };

        const cancelButton
            = APP.translation.generateTranslationHTML("dialog.Cancel");
        const saveButton
            = APP.translation.generateTranslationHTML("dialog.Save");

        // Create the settings dialog.
        var settingsDialog
            = APP.UI.messageHandler.openDialogWithStates(
            states,
            {
                persistent: false,
                buttons: [
                    {title: cancelButton, value: false},
                    {title: saveButton, value: true}
                ],
                closeText: '',
                loaded: this._onLoadMediaSettings.bind(this),
                position: {width: 500},
                submit: function (e, v, m, f) {
                    e.preventDefault();
                    if (!v) {

                    }
                }
            }, null);
        JitsiMeetJS.analytics.sendEvent('settings.open');
    }
};

// Exports the SettingsDialog class.
module.exports = SettingsDialog;
