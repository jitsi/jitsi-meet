import { MEDIA_TYPE } from '../base/media';
import { toState } from '../base/redux';
import { isLocalCameraTrackMuted, isLocalTrackMuted } from '../base/tracks';
import { addHashParamsToURL } from '../base/util';

/**
 * Adds the current track state to the passed URL.
 *
 * @param {URL} url - The URL that will be modified.
 * @param {Function|Object} stateful - The redux store or {@code getState} function.
 * @returns {URL} - Returns the modified URL.
 */
export function addTrackStateToURL(url, stateful) {
    const state = toState(stateful);
    const tracks = state['features/base/tracks'];
    const isVideoMuted = isLocalCameraTrackMuted(tracks);
    const isAudioMuted = isLocalTrackMuted(tracks, MEDIA_TYPE.AUDIO);

    return addHashParamsToURL(new URL(url), { // use new URL object in order to not pollute the passed parameter.
        'config.startWithAudioMuted': isAudioMuted,
        'config.startWithVideoMuted': isVideoMuted
    });

}
