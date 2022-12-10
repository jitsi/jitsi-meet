import { IStateful } from '../app/types';
import { toState } from '../redux/functions';
import { getPropertyValue } from '../settings/functions';

import { VIDEO_MUTISM_AUTHORITY } from './constants';


// XXX The configurations/preferences/settings startWithAudioMuted and startWithVideoMuted were introduced for
// conferences/meetings. So it makes sense for these to not be considered outside of conferences/meetings
// (e.g. WelcomePage). Later on, though, we introduced a "Video <-> Voice" toggle on the WelcomePage which utilizes
// startAudioOnly outside of conferences/meetings so that particular configuration/preference/setting employs slightly
// exclusive logic.
const START_WITH_AUDIO_VIDEO_MUTED_SOURCES = {
    // We have startWithAudioMuted and startWithVideoMuted here:
    config: true,
    settings: true,

    // XXX We've already overwritten base/config with urlParams. However,
    // settings are more important than the server-side config.
    // Consequently, we need to read from urlParams anyway:
    urlParams: true,

    // We don't have startWithAudioMuted and startWithVideoMuted here:
    jwt: false
};

/**
 * Determines whether audio is currently muted.
 *
 * @param {Function|Object} stateful - The redux store, state, or
 * {@code getState} function.
 * @returns {boolean}
 */
export function isAudioMuted(stateful: IStateful) {
    return Boolean(toState(stateful)['features/base/media'].audio.muted);
}

/**
 * Determines whether video is currently muted by the audio-only authority.
 *
 * @param {Function|Object} stateful - The redux store, state, or
 * {@code getState} function.
 * @returns {boolean}
 */
export function isVideoMutedByAudioOnly(stateful: IStateful) {
    return (
        _isVideoMutedByAuthority(stateful, VIDEO_MUTISM_AUTHORITY.AUDIO_ONLY));
}

/**
 * Determines whether video is currently muted by a specific
 * {@code VIDEO_MUTISM_AUTHORITY}.
 *
 * @param {Function|Object} stateful - The redux store, state, or
 * {@code getState} function.
 * @param {number} videoMutismAuthority - The {@code VIDEO_MUTISM_AUTHORITY}
 * which is to be checked whether it has muted video.
 * @returns {boolean} If video is currently muted by the specified
 * {@code videoMutismAuthority}, then {@code true}; otherwise, {@code false}.
 */
function _isVideoMutedByAuthority(
        stateful: IStateful,
        videoMutismAuthority: number) {
    const { muted } = toState(stateful)['features/base/media'].video;

    // eslint-disable-next-line no-bitwise
    return Boolean(muted & videoMutismAuthority);
}

/**
 * Computes the startWithAudioMuted by retrieving its values from config, URL and settings.
 *
 * @param {Object|Function} stateful - The redux state object or {@code getState} function.
 * @returns {boolean} - The computed startWithAudioMuted value that will be used.
 */
export function getStartWithAudioMuted(stateful: IStateful) {
    return Boolean(getPropertyValue(stateful, 'startWithAudioMuted', START_WITH_AUDIO_VIDEO_MUTED_SOURCES))
        || Boolean(getPropertyValue(stateful, 'startSilent', START_WITH_AUDIO_VIDEO_MUTED_SOURCES));
}

/**
 * Computes the startWithVideoMuted by retrieving its values from config, URL and settings.
 *
 * @param {Object|Function} stateful - The redux state object or {@code getState} function.
 * @returns {boolean} - The computed startWithVideoMuted value that will be used.
 */
export function getStartWithVideoMuted(stateful: IStateful) {
    return Boolean(getPropertyValue(stateful, 'startWithVideoMuted', START_WITH_AUDIO_VIDEO_MUTED_SOURCES));
}

/**
 * Determines whether video is currently muted.
 *
 * @param {Function|Object} stateful - The redux store, state, or {@code getState} function.
 * @returns {boolean}
 */
export function isVideoMuted(stateful: IStateful) {
    return Boolean(toState(stateful)['features/base/media'].video.muted);
}

/**
 * Determines whether video is currently muted by the user authority.
 *
 * @param {Function|Object} stateful - The redux store, state, or
 * {@code getState} function.
 * @returns {boolean}
 */
export function isVideoMutedByUser(stateful: IStateful) {
    return _isVideoMutedByAuthority(stateful, VIDEO_MUTISM_AUTHORITY.USER);
}

/**
 * Determines whether a specific videoTrack should be rendered.
 *
 * @param {Track} videoTrack - The video track which is to be rendered.
 * @param {boolean} waitForVideoStarted - True if the specified videoTrack
 * should be rendered only after its associated video has started;
 * otherwise, false.
 * @returns {boolean} True if the specified videoTrack should be rendered;
 * otherwise, false.
 */
export function shouldRenderVideoTrack(
        videoTrack: { muted: boolean; videoStarted: boolean; } | undefined,
        waitForVideoStarted: boolean) {
    return (
        videoTrack
            && !videoTrack.muted
            && (!waitForVideoStarted || videoTrack.videoStarted));
}
