/* global APP, JitsiMeetJS */

import {
    notifyCameraError,
    notifyMicError
} from '../../react/features/base/devices/actions.web';
import {
    flattenAvailableDevices,
    getAudioOutputDeviceId
} from '../../react/features/base/devices/functions.web';
import { updateSettings } from '../../react/features/base/settings/actions';
import {
    getUserSelectedCameraDeviceId,
    getUserSelectedMicDeviceId,
    getUserSelectedOutputDeviceId
} from '../../react/features/base/settings/functions';

/**
 * Determines if currently selected audio output device should be changed after
 * list of available devices has been changed.
 *
 * @param {MediaDeviceInfo[]} newDevices - The updated list of available devices.
 * @returns {string|undefined} The audio output device ID to select, or undefined if no switch is needed.
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
 *
 * @param {MediaDeviceInfo[]} newDevices - The updated list of available devices.
 * @param {JitsiLocalTrack|null|undefined} localAudio - The current local audio track, if any.
 * @param {boolean} newLabel - Whether device labels have just become available.
 * @returns {string|undefined} The microphone device ID to select, or undefined if no switch is needed.
 */
function getNewAudioInputDevice(newDevices, localAudio, newLabel) {
    const availableAudioInputDevices = newDevices.filter(
        d => d.kind === 'audioinput');
    const selectedAudioInputDeviceId = getUserSelectedMicDeviceId(APP.store.getState());
    const selectedAudioInputDevice = availableAudioInputDevices.find(
        d => d.deviceId === selectedAudioInputDeviceId);
    const localAudioDeviceId = localAudio?.getDeviceId();
    const localAudioDevice = availableAudioInputDevices.find(
        d => d.deviceId === localAudioDeviceId);

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
        && selectedAudioInputDeviceId !== localAudioDeviceId) {

        if (newLabel) {
            // If a Firefox user with manual permission prompt chose a different
            // device from what we have stored as the preferred device we accept
            // and store that as the new preferred device.
            APP.store.dispatch(updateSettings({
                userSelectedMicDeviceId: localAudioDeviceId,
                userSelectedMicDeviceLabel: localAudioDevice.label
            }));
        } else {
            // And here we handle case when we already have some device working,
            // but we plug-in a "preferred" (previously selected in settings, stored
            // in local storage) device.
            return selectedAudioInputDeviceId;
        }
    }
}

/**
 * Determines if currently selected video input device should be changed after
 * list of available devices has been changed.
 *
 * @param {MediaDeviceInfo[]} newDevices - The updated list of available devices.
 * @param {JitsiLocalTrack|null|undefined} localVideo - The current local video track, if any.
 * @param {boolean} newLabel - Whether device labels have just become available.
 * @returns {string|undefined} The camera device ID to select, or undefined if no switch is needed.
 */
function getNewVideoInputDevice(newDevices, localVideo, newLabel) {
    const availableVideoInputDevices = newDevices.filter(
        d => d.kind === 'videoinput');
    const selectedVideoInputDeviceId = getUserSelectedCameraDeviceId(APP.store.getState());
    const selectedVideoInputDevice = availableVideoInputDevices.find(
        d => d.deviceId === selectedVideoInputDeviceId);
    const localVideoDeviceId = localVideo?.getDeviceId();
    const localVideoDevice = availableVideoInputDevices.find(
        d => d.deviceId === localVideoDeviceId);

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
            && selectedVideoInputDeviceId !== localVideoDeviceId) {

        if (newLabel) {
            // If a Firefox user with manual permission prompt chose a different
            // device from what we have stored as the preferred device we accept
            // and store that as the new preferred device.
            APP.store.dispatch(updateSettings({
                userSelectedCameraDeviceId: localVideoDeviceId,
                userSelectedCameraDeviceLabel: localVideoDevice.label
            }));
        } else {
            // And here we handle case when we already have some device working,
            // but we plug-in a "preferred" (previously selected in settings, stored
            // in local storage) device.
            return selectedVideoInputDeviceId;
        }
    }
}

export default {
    /**
     * Determines if currently selected media devices should be changed after
     * list of available devices has been changed.
     *
     * @param {MediaDeviceInfo[]} newDevices - The updated list of available devices.
     * @param {JitsiLocalTrack|null|undefined} localVideo - The current local video track, if any.
     * @param {JitsiLocalTrack|null|undefined} localAudio - The current local audio track, if any.
     * @param {boolean} newLabels - Whether device labels have just become available.
     * @returns {{audioinput: (string|undefined), videoinput: (string|undefined), audiooutput: (string|undefined)}}
     *     Device IDs to select for each media type; undefined means no change is needed.
     */
    getNewMediaDevicesAfterDeviceListChanged( // eslint-disable-line max-params
            newDevices,
            localVideo,
            localAudio,
            newLabels) {
        return {
            audioinput: getNewAudioInputDevice(newDevices, localAudio, newLabels),
            videoinput: getNewVideoInputDevice(newDevices, localVideo, newLabels),
            audiooutput: getNewAudioOutputDevice(newDevices)
        };
    },

    /**
     * Checks whether the previous and updated device lists have the same number
     * of devices. The label comparisons below do not affect the result because
     * returning from the forEach callback does not return from this method.
     *
     * @param {Object} oldDevices - The previously available devices, grouped by type.
     * @param {MediaDeviceInfo[]} newDevices - The updated list of available devices.
     * @returns {boolean} Whether the flattened previous list and updated list have the same length.
     */
    newDeviceListAddedLabelsOnly(oldDevices, newDevices) {
        const oldDevicesFlattend = flattenAvailableDevices(oldDevices);

        if (oldDevicesFlattend.length !== newDevices.length) {
            return false;
        }
        oldDevicesFlattend.forEach(oldDevice => {
            if (oldDevice.label !== '') {
                return false;
            }
            const newDevice = newDevices.find(nd => nd.deviceId === oldDevice.deviceId);

            if (!newDevice || newDevice.label === '') {
                return false;
            }
        });

        return true;
    },

    /**
     * Creates local tracks for the newly available devices. If creating audio
     * and video together fails, retries each requested track separately.
     *
     * @param {function(Object): Promise<JitsiLocalTrack[]>} createLocalTracks - Creates
     *     local tracks from device options.
     * @param {string|null|undefined} cameraDeviceId - ID of the camera to use, if requested.
     * @param {string|null|undefined} micDeviceId - ID of the microphone to use, if requested.
     * @returns {Promise<JitsiLocalTrack[]>} The tracks that were created successfully.
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
         * Creates an audio track and records any creation error for notification.
         *
         * @param {boolean} [showError=true] - Whether to notify immediately when creation fails.
         * @returns {Promise<JitsiLocalTrack[]>} The created track, or an empty array on failure.
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
                    showError && APP.store.dispatch(notifyMicError(err));

                    return [];
                }));
        }

        /**
         * Creates a video track and records any creation error for notification.
         *
         * @param {boolean} [showError=true] - Whether to notify immediately when creation fails.
         * @returns {Promise<JitsiLocalTrack[]>} The created track, or an empty array on failure.
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
