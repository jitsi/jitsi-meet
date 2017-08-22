import { VIDEO_MUTISM_AUTHORITY } from './constants';

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
export function shouldRenderVideoTrack(videoTrack, waitForVideoStarted) {
    return (
        videoTrack
            && !videoTrack.muted
            && (!waitForVideoStarted || videoTrack.videoStarted));
}

/**
 * Checks if video is currently muted by the user authority.
 *
 * @param {Object} store - The redux store instance.
 * @returns {boolean}
 */
export function isVideoMutedByUser({ getState }) {
    return Boolean(
        getState()['features/base/media'] // eslint-disable-line no-bitwise
            .video.muted & VIDEO_MUTISM_AUTHORITY.USER);
}
