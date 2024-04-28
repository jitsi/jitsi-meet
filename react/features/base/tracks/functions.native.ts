import { IStore } from '../../app/types';
import JitsiMeetJS from '../lib-jitsi-meet';

import { getCameraFacingMode } from './functions.any';
import { ITrackOptions } from './types';

export * from './functions.any';

/**
 * Create local tracks of specific types.
 *
 * @param {Object} options - The options with which the local tracks are to be
 * created.
 * @param {string|null} [options.cameraDeviceId] - Camera device id or
 * {@code undefined} to use app's settings.
 * @param {string[]} options.devices - Required track types such as 'audio'
 * and/or 'video'.
 * @param {string|null} [options.micDeviceId] - Microphone device id or
 * {@code undefined} to use app's settings.
 * @param {number|undefined} [oprions.timeout] - A timeout for JitsiMeetJS.createLocalTracks used to create the tracks.
 * @param {boolean} [options.firePermissionPromptIsShownEvent] - Whether lib-jitsi-meet
 * should check for a {@code getUserMedia} permission prompt and fire a
 * corresponding event.
 * @param {IStore} store - The redux store in the context of which the function
 * is to execute and from which state such as {@code config} is to be retrieved.
 * @returns {Promise<JitsiLocalTrack[]>}
 */
export function createLocalTracksF(options: ITrackOptions = {}, store: IStore) {
    const { cameraDeviceId, micDeviceId } = options;
    const state = store.getState();
    const {
        resolution
    } = state['features/base/config'];
    const constraints = options.constraints ?? state['features/base/config'].constraints;

    return JitsiMeetJS.createLocalTracks(
        {
            cameraDeviceId,
            constraints,

            // Copy array to avoid mutations inside library.
            devices: options.devices?.slice(0),
            facingMode: options.facingMode || getCameraFacingMode(state),
            micDeviceId,
            resolution
        });
}
