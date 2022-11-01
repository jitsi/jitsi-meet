import { createLocalTrack } from '../base/lib-jitsi-meet/functions';

export * from './functions.any';

/**
 * Returns a promise which resolves with a list of objects containing
 * all the video jitsiTracks and appropriate errors for the given device ids.
 *
 * @param {string[]} ids - The list of the camera ids for which to create tracks.
 * @param {number} [timeout] - A timeout for the createLocalTrack function call.
 *
 * @returns {Promise<Object[]>}
 */
export function createLocalVideoTracks(ids: string[], timeout?: number) {
    return Promise.all(ids.map(deviceId => createLocalTrack('video', deviceId, timeout)
                    .then((jitsiTrack: any) => {
                        return {
                            jitsiTrack,
                            deviceId
                        };
                    })
                    .catch(() => {
                        return {
                            jitsiTrack: null,
                            deviceId,
                            error: 'deviceSelection.previewUnavailable'
                        };
                    })));
}


/**
 * Returns a promise which resolves with a list of objects containing
 * the audio track and the corresponding audio device information.
 *
 * @param {Object[]} devices - A list of microphone devices.
 * @param {number} [timeout] - A timeout for the createLocalTrack function call.
 * @returns {Promise<{
 *   deviceId: string,
 *   hasError: boolean,
 *   jitsiTrack: Object,
 *   label: string
 * }[]>}
 */
export function createLocalAudioTracks(devices: MediaDeviceInfo[], timeout?: number) {
    return Promise.all(
        devices.map(async ({ deviceId, label }) => {
            let jitsiTrack = null;
            let hasError = false;

            try {
                jitsiTrack = await createLocalTrack('audio', deviceId, timeout);
            } catch (err) {
                hasError = true;
            }

            return {
                deviceId,
                hasError,
                jitsiTrack,
                label
            };
        }));
}
