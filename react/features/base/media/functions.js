/* @flow */

import { VIDEO_MUTISM_AUTHORITY } from './constants';

/**
 * Determines whether video is currently muted by the audio-only authority.
 *
 * @param {Store} store - The redux store.
 * @returns {boolean}
 */
export function isVideoMutedByAudioOnly(store: { getState: Function }) {
    return _isVideoMutedByAuthority(store, VIDEO_MUTISM_AUTHORITY.AUDIO_ONLY);
}

/**
 * Determines whether video is currently muted by a specific
 * <tt>VIDEO_MUTISM_AUTHORITY</tt>.
 *
 * @param {Store} store - The redux store.
 * @param {number} videoMutismAuthority - The <tt>VIDEO_MUTISM_AUTHORITY</tt>
 * which is to be checked whether it has muted video.
 * @returns {boolean} If video is currently muted by the specified
 * <tt>videoMutismAuthority</tt>, then <tt>true</tt>; otherwise, <tt>false</tt>.
 */
function _isVideoMutedByAuthority(
        { getState }: { getState: Function },
        videoMutismAuthority: number) {
    return Boolean(

        // eslint-disable-next-line no-bitwise
        getState()['features/base/media'].video.muted & videoMutismAuthority);
}

/**
 * Determines whether video is currently muted by the user authority.
 *
 * @param {Store} store - The redux store.
 * @returns {boolean}
 */
export function isVideoMutedByUser(store: { getState: Function }) {
    return _isVideoMutedByAuthority(store, VIDEO_MUTISM_AUTHORITY.USER);
}

/**
 * Determines whether a specific videoTrack should be rendered.
 *
 * @param {Track} videoTrack - The video track which is to be rendered.
 * @param {boolean} waitForVideoStarted - True if the specified videoTrack
 * should be rendered only after its associated video has started;
 * otherwise, false.
 * @returns {boolean} True if the specified videoTrack should be renderd;
 * otherwise, false.
 */
export function shouldRenderVideoTrack(
        videoTrack: { muted: boolean, videoStarted: boolean },
        waitForVideoStarted: boolean) {
    return (
        videoTrack
            && !videoTrack.muted
            && (!waitForVideoStarted || videoTrack.videoStarted));
}
