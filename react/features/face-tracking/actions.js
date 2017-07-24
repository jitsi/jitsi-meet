import {
    ENABLE_FACE_TRACKING,
    DISABLE_FACE_TRACKING,
    ADD_FACE_TRACKER,
    SHOW_PROMPT,
    HIDE_PROMPT
} from './actionTypes';

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

/**
 * Disables face tracking mechanism on a target video.
 *
 * @param {HTMLVideoElement|Object} videoElement - The target face-tracking
 * video.
 * @returns {Object}
 */
export function disableFaceTracking(videoElement) {
    return {
        type: DISABLE_FACE_TRACKING,
        videoElement
    };
}

/**
 * Adds a FaceTracker instance in the middleware.
 *
 * @param {HTMLVideoElement|Object} videoElement - The target face-tracking
 * video.
 * @param {HTMLDivElement|Object} wrapperElement - The wrapper element of video.
 * @param {number} delay - Tracking delay.
 * @param {number} duration - Duration for warning information.
 * @param {number} fps - Face tracking count per second.
 * @param {number} threshold - Threshold of pixels for auto-scaling of
 * tracking.
 * @returns {Object}
 */
export function addFaceTracker({
    videoElement,
    wrapperElement,
    delay,
    duration,
    fps }) {
    return {
        type: ADD_FACE_TRACKER,
        videoElement,
        wrapperElement,
        delay,
        duration,
        fps
    };
}

/**
 * Shows face prompt on a video.
 *
 * @param {HTMLVideoElement|Object} videoElement - The target face-tracking
 * video.
 * @returns {Object}
 */
export function showPrompt(videoElement) {
    return {
        type: SHOW_PROMPT,
        videoElement
    };
}

/**
 * Hides face prompt on a video.
 *
 * @param {HTMLVideoElement|Object} videoElement - The target face-tracking
 * video.
 * @returns {Object}
 */
export function hidePrompt(videoElement) {
    return {
        type: HIDE_PROMPT,
        videoElement
    };
}
