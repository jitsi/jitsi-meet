import { ENABLE_FACE_TRACKING } from './actionTypes';

/**
 * Enables face tracking mechanism on a target video.
 *
 * @param {HTMLVideoElement|Object} videoElement - The target face-tracking
 * video.
 * @returns {Object}
 */
export function enableFaceTracking(videoElement) {
    return {
        type: ENABLE_FACE_TRACKING,
        videoElement
    };
}
