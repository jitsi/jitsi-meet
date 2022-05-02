// @flow

/**
 * The set of facing modes for camera.
 *
 * @enum {string}
 */
export const CAMERA_FACING_MODE = {
    ENVIRONMENT: 'environment',
    USER: 'user'
};

export type MediaType = 'audio' | 'video' | 'presenter' | 'screenshare';

/**
 * The set of media types.
 *
 * @enum {string}
 */
export const MEDIA_TYPE = {
    AUDIO: 'audio',
    PRESENTER: 'presenter',
    SCREENSHARE: 'screenshare',
    VIDEO: 'video'
};


/* eslint-disable no-bitwise */

/**
 * The types of authorities which may mute/unmute the local screenshare.
 *
 * @enum {number}
 */
export const SCREENSHARE_MUTISM_AUTHORITY = {
    AUDIO_ONLY: 1 << 0,
    USER: 1 << 2
};

/**
 * The types of authorities which may mute/unmute the local video.
 *
 * @enum {number}
 */
export const VIDEO_MUTISM_AUTHORITY = {
    AUDIO_ONLY: 1 << 0,
    BACKGROUND: 1 << 1,
    USER: 1 << 2
};

/* eslint-enable no-bitwise */

/**
 * The types of video tracks.
 *
 * @enum {string}
 */
export const VIDEO_TYPE = {
    CAMERA: 'camera',
    DESKTOP: 'desktop'
};
