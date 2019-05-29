/* global APP, JitsiMeetJS */

import {
    getAudioOutputDeviceId,
    notifyCameraError,
    notifyMicError
} from '../../react/features/base/devices';
import {
    getUserSelectedCameraDeviceId,
    getUserSelectedMicDeviceId,
    getUserSelectedOutputDeviceId
} from '../../react/features/base/settings';

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

    const selectedAudioOutputDeviceId = getAudioOutputDeviceId();
    const availableAudioOutputDevices = newDevices.filter(
        d => d.kind === 'audiooutput');

    // Switch to 'default' audio output device if we don't have the selected one
    // available anymore.
    if (selectedAudioOutputDeviceId !== 'default'
        && !availableAudioOutputDevices.find(d =>
            d.deviceId === selectedAudioOutputDeviceId)) {
        return 'default';
    }

    const preferredAudioOutputDeviceId = getUserSelectedOutputDeviceId(APP.store.getState());

    // if the preferred one is not the selected and is available in the new devices
    // we want to use it as it was just added
    if (preferredAudioOutputDeviceId
        && preferredAudioOutputDeviceId !== selectedAudioOutputDeviceId
        && availableAudioOutputDevices.find(d => d.deviceId === preferredAudioOutputDeviceId)) {
        return preferredAudioOutputDeviceId;
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
    const availableAudioInputDevices = newDevices.filter(
        d => d.kind === 'audioinput');
    const selectedAudioInputDeviceId = getUserSelectedMicDeviceId(APP.store.getState());
    const selectedAudioInputDevice = availableAudioInputDevices.find(
        d => d.deviceId === selectedAudioInputDeviceId);

    // Here we handle case when no device was initially plugged, but
    // then it's connected OR new device was connected when previous
    // track has ended.
    if (!localAudio || localAudio.disposed || localAudio.isEnded()) {
        // If we have new audio device and permission to use it was granted
        // (label is not an empty string), then we will try to use the first
        // available device.
        if (selectedAudioInputDevice && selectedAudioInputDeviceId) {
            return selectedAudioInputDeviceId;
        } else if (availableAudioInputDevices.length
            && availableAudioInputDevices[0].label !== '') {
            return availableAudioInputDevices[0].deviceId;
        }
    } else if (selectedAudioInputDevice
        && selectedAudioInputDeviceId !== localAudio.getDeviceId()) {

        // And here we handle case when we already have some device working,
        // but we plug-in a "preferred" (previously selected in settings, stored
        // in local storage) device.
        return selectedAudioInputDeviceId;
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
    const availableVideoInputDevices = newDevices.filter(
        d => d.kind === 'videoinput');
    const selectedVideoInputDeviceId = getUserSelectedCameraDeviceId(APP.store.getState());
    const selectedVideoInputDevice = availableVideoInputDevices.find(
        d => d.deviceId === selectedVideoInputDeviceId);

    // Here we handle case when no video input device was initially plugged,
    // but then device is connected OR new device was connected when
    // previous track has ended.
    if (!localVideo || localVideo.disposed || localVideo.isEnded()) {
        // If we have new video device and permission to use it was granted
        // (label is not an empty string), then we will try to use the first
        // available device.
        if (selectedVideoInputDevice && selectedVideoInputDeviceId) {
            return selectedVideoInputDeviceId;
        } else if (availableVideoInputDevices.length
            && availableVideoInputDevices[0].label !== '') {
            return availableVideoInputDevices[0].deviceId;
        }
    } else if (selectedVideoInputDevice
            && selectedVideoInputDeviceId !== localVideo.getDeviceId()) {
        // And here we handle case when we already have some device working,
        // but we plug-in a "preferred" (previously selected in settings, stored
        // in local storage) device.
        return selectedVideoInputDeviceId;
    }
}

export default {
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
    getNewMediaDevicesAfterDeviceListChanged( // eslint-disable-line max-params
            newDevices,
            isSharingScreen,
            localVideo,
            localAudio) {
        return {
            audioinput: getNewAudioInputDevice(newDevices, localAudio),
            videoinput: isSharingScreen ? undefined : getNewVideoInputDevice(newDevices, localVideo),
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
            createLocalTracks,
            cameraDeviceId,
            micDeviceId) {
        let audioTrackError;
        let videoTrackError;
        const audioRequested = Boolean(micDeviceId);
        const videoRequested = Boolean(cameraDeviceId);

        if (audioRequested && videoRequested) {
            // First we try to create both audio and video tracks together.
            return (
                createLocalTracks({
                    devices: [ 'audio', 'video' ],
                    cameraDeviceId,
                    micDeviceId
                })

                // If we fail to do this, try to create them separately.
                .catch(() => Promise.all([
                    createAudioTrack(false).then(([ stream ]) => stream),
                    createVideoTrack(false).then(([ stream ]) => stream)
                ]))
                .then(tracks => {
                    if (audioTrackError) {
                        APP.store.dispatch(notifyMicError(audioTrackError));
                    }

                    if (videoTrackError) {
                        APP.store.dispatch(notifyCameraError(videoTrackError));
                    }

                    return tracks.filter(t => typeof t !== 'undefined');
                }));
        } else if (videoRequested && !audioRequested) {
            return createVideoTrack();
        } else if (audioRequested && !videoRequested) {
            return createAudioTrack();
        }

        return Promise.resolve([]);

        /**
         *
         */
        function createAudioTrack(showError = true) {
            return (
                createLocalTracks({
                    devices: [ 'audio' ],
                    cameraDeviceId: null,
                    micDeviceId
                })
                .catch(err => {
                    audioTrackError = err;
                    showError && APP.store.disptach(notifyMicError(err));

                    return [];
                }));
        }

        /**
         *
         */
        function createVideoTrack(showError = true) {
            return (
                createLocalTracks({
                    devices: [ 'video' ],
                    cameraDeviceId,
                    micDeviceId: null
                })
                .catch(err => {
                    videoTrackError = err;
                    showError && APP.store.dispatch(notifyCameraError(err));

                    return [];
                }));
        }
    }
};
