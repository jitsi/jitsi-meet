/* global APP, JitsiMeetJS */

let currentAudioInputDevices,
    currentVideoInputDevices,
    currentAudioOutputDevices;

/**
 * Determines if currently selected audio output device should be changed after
 * list of available devices has been changed.
 * @param {MediaDeviceInfo[]} newDevices
 * @returns {string|undefined} - ID of new audio output device to use, undefined
 *      if audio output device should not be changed.
 */
function getNewAudioOutputDevice(newDevices) {
    if (!JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
        return;
    }

    let selectedAudioOutputDeviceId = APP.settings.getAudioOutputDeviceId();
    let availableAudioOutputDevices = newDevices.filter(
        d => d.kind === 'audiooutput');

    // Switch to 'default' audio output device if we don't have the selected one
    // available anymore.
    if (selectedAudioOutputDeviceId !== 'default' &&
        !availableAudioOutputDevices.find(d =>
            d.deviceId === selectedAudioOutputDeviceId)) {
        return 'default';
    }
}

/**
 * Determines if currently selected audio input device should be changed after
 * list of available devices has been changed.
 * @param {MediaDeviceInfo[]} newDevices
 * @param {JitsiLocalTrack} localAudio
 * @returns {string|undefined} - ID of new microphone device to use, undefined
 *      if audio input device should not be changed.
 */
function getNewAudioInputDevice(newDevices, localAudio) {
    let availableAudioInputDevices = newDevices.filter(
        d => d.kind === 'audioinput');
    let selectedAudioInputDeviceId = APP.settings.getMicDeviceId();
    let selectedAudioInputDevice = availableAudioInputDevices.find(
        d => d.deviceId === selectedAudioInputDeviceId);

    // Here we handle case when no device was initially plugged, but
    // then it's connected OR new device was connected when previous
    // track has ended.
    if (!localAudio || localAudio.disposed || localAudio.isEnded()) {
        // If we have new audio device and permission to use it was granted
        // (label is not an empty string), then we will try to use the first
        // available device.
        if (availableAudioInputDevices.length &&
            availableAudioInputDevices[0].label !== '') {
            return availableAudioInputDevices[0].deviceId;
        }
        // Otherwise we assume that we don't have any audio input devices
        // to use and that's why disable microphone button on UI.
        else {
            APP.UI.setMicrophoneButtonEnabled(false);
        }
    } else {
        // And here we handle case when we already have some device working,
        // but we plug-in a "preferred" (previously selected in settings, stored
        // in local storage) device.
        if (selectedAudioInputDevice &&
            selectedAudioInputDeviceId !== localAudio.getDeviceId()) {
            return selectedAudioInputDeviceId;
        }
    }
}

/**
 * Determines if currently selected video input device should be changed after
 * list of available devices has been changed.
 * @param {MediaDeviceInfo[]} newDevices
 * @param {JitsiLocalTrack} localVideo
 * @returns {string|undefined} - ID of new camera device to use, undefined
 *      if video input device should not be changed.
 */
function getNewVideoInputDevice(newDevices, localVideo) {
    let availableVideoInputDevices = newDevices.filter(
        d => d.kind === 'videoinput');
    let selectedVideoInputDeviceId = APP.settings.getCameraDeviceId();
    let selectedVideoInputDevice = availableVideoInputDevices.find(
        d => d.deviceId === selectedVideoInputDeviceId);

    // Here we handle case when no video input device was initially plugged,
    // but then device is connected OR new device was connected when
    // previous track has ended.
    if (!localVideo || localVideo.disposed || localVideo.isEnded()) {
        // If we have new video device and permission to use it was granted
        // (label is not an empty string), then we will try to use the first
        // available device.
        if (availableVideoInputDevices.length &&
            availableVideoInputDevices[0].label !== '') {
            return availableVideoInputDevices[0].deviceId;
        }
    } else {
        // And here we handle case when we already have some device working,
        // but we plug-in a "preferred" (previously selected in settings, stored
        // in local storage) device.
        if (selectedVideoInputDevice &&
            selectedVideoInputDeviceId !== localVideo.getDeviceId()) {
            return selectedVideoInputDeviceId;
        }
    }
}

export default {
    /**
     * Returns list of devices of single kind.
     * @param {MediaDeviceInfo[]} devices
     * @param {'audioinput'|'audiooutput'|'videoinput'} kind
     * @returns {MediaDeviceInfo[]}
     */
    getDevicesFromListByKind(devices, kind) {
        return devices.filter(d => d.kind === kind);
    },
    /**
     * Stores lists of current 'audioinput', 'videoinput' and 'audiooutput'
     * devices.
     * @param {MediaDeviceInfo[]} devices
     */
    setCurrentMediaDevices(devices) {
        currentAudioInputDevices =
            this.getDevicesFromListByKind(devices, 'audioinput');
        currentVideoInputDevices =
            this.getDevicesFromListByKind(devices, 'videoinput');
        currentAudioOutputDevices =
            this.getDevicesFromListByKind(devices, 'audiooutput');
    },
    /**
     * Returns lists of current 'audioinput', 'videoinput' and 'audiooutput'
     * devices.
     * @returns {{
     *  audioinput: (MediaDeviceInfo[]|undefined),
     *  videoinput: (MediaDeviceInfo[]|undefined),
     *  audiooutput: (MediaDeviceInfo[]|undefined),
     *  }}
     */
    getCurrentMediaDevices() {
        return {
            audioinput: currentAudioInputDevices,
            videoinput: currentVideoInputDevices,
            audiooutput: currentAudioOutputDevices
        };
    },
    /**
     * Determines if currently selected media devices should be changed after
     * list of available devices has been changed.
     * @param {MediaDeviceInfo[]} newDevices
     * @param {boolean} isSharingScreen
     * @param {JitsiLocalTrack} localVideo
     * @param {JitsiLocalTrack} localAudio
     * @returns {{
     *  audioinput: (string|undefined),
     *  videoinput: (string|undefined),
     *  audiooutput: (string|undefined)
     *  }}
     */
    getNewMediaDevicesAfterDeviceListChanged(
        newDevices, isSharingScreen, localVideo, localAudio) {
        return {
            audioinput: getNewAudioInputDevice(newDevices, localAudio),
            videoinput: !isSharingScreen &&
                getNewVideoInputDevice(newDevices, localVideo),
            audiooutput: getNewAudioOutputDevice(newDevices)
        };
    },
    /**
     * Tries to create new local tracks for new devices obtained after device
     * list changed. Shows error dialog in case of failures.
     * @param {function} createLocalTracks
     * @param {string} (cameraDeviceId)
     * @param {string} (micDeviceId)
     * @returns {Promise.<JitsiLocalTrack[]>}
     */
    createLocalTracksAfterDeviceListChanged(
        createLocalTracks, cameraDeviceId, micDeviceId) {
        let audioTrackError;
        let videoTrackError;
        let audioRequested = !!micDeviceId;
        let videoRequested = !!cameraDeviceId;

        if (audioRequested && videoRequested) {
            // First we try to create both audio and video tracks together.
            return createLocalTracks({
                        devices: ['audio', 'video'],
                        cameraDeviceId: cameraDeviceId,
                        micDeviceId: micDeviceId
                    })
                    // If we fail to do this, try to create them separately.
                    .catch(() => Promise.all([
                        createAudioTrack(false).then(([stream]) => stream),
                        createVideoTrack(false).then(([stream]) => stream)
                    ]))
                    .then(tracks => {
                        if (audioTrackError || videoTrackError) {
                            APP.UI.showDeviceErrorDialog(
                                audioTrackError, videoTrackError);
                        }

                        return tracks.filter(t => typeof t !== 'undefined');
                    });
        } else if (videoRequested && !audioRequested) {
            return createVideoTrack();
        } else if (audioRequested && !videoRequested) {
            return createAudioTrack();
        } else {
            return Promise.resolve([]);
        }

        function createAudioTrack(showError) {
            return createLocalTracks({
                    devices: ['audio'],
                    cameraDeviceId: null,
                    micDeviceId: micDeviceId
                })
                .catch(err => {
                    audioTrackError = err;
                    showError && APP.UI.showDeviceErrorDialog(err, null);
                    return [];
                });
        }

        function createVideoTrack(showError) {
            return createLocalTracks({
                    devices: ['video'],
                    cameraDeviceId: cameraDeviceId,
                    micDeviceId: null
                })
                .catch(err => {
                    videoTrackError = err;
                    showError && APP.UI.showDeviceErrorDialog(null, err);
                    return [];
                });
        }
    }
};
