// @flow

import JitsiMeetJS from '../lib-jitsi-meet';
import { updateSettings } from '../settings';

/**
 * Get device id of the audio output device which is currently in use.
 * Empty string stands for default device.
 *
 * @returns {string}
 */
export function getAudioOutputDeviceId() {
    return JitsiMeetJS.mediaDevices.getAudioOutputDevice();
}

/**
 * Set device id of the audio output device which is currently in use.
 * Empty string stands for default device.
 *
 * @param {string} newId - New audio output device id.
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {Promise}
 */
export function setAudioOutputDeviceId(
        newId: string = 'default',
        dispatch: Function): Promise<*> {
    return JitsiMeetJS.mediaDevices.setAudioOutputDevice(newId)
        .then(() =>
            dispatch(updateSettings({
                audioOutputDeviceId: newId
            })));
}
