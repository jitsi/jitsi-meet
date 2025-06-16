/**
 * Default last-n value used to be used for "HD" video quality setting when no channelLastN value is specified.
 *
 * @type {number}
 */
export const DEFAULT_LAST_N = 20;

/**
 * The supported video codecs.
 *
 * @type {enum}
 */
export enum VIDEO_CODEC {
    AV1 = 'av1',
    H264 = 'h264',
    VP8 = 'vp8',
    VP9 = 'vp9'
}

/**
 * The supported remote video resolutions. The values are currently based on
 * available simulcast layers.
 *
 * @type {object}
 */
export const VIDEO_QUALITY_LEVELS = {
    ULTRA: 2160,
    HIGH: 720,
    STANDARD: 360,
    LOW: 180,
    NONE: 0
};

/**
 * Indicates unlimited video quality.
 */
export const VIDEO_QUALITY_UNLIMITED = -1;

/**
 * The maximum video quality from the VIDEO_QUALITY_LEVELS map.
 */
export const MAX_VIDEO_QUALITY = Math.max(...Object.values(VIDEO_QUALITY_LEVELS));

/**
 * Maps quality level names used in the config.videoQuality.minHeightForQualityLvl to the quality level constants used
 * by the application.
 *
 * @type {Object}
 */
export const CFG_LVL_TO_APP_QUALITY_LVL = {
    'low': VIDEO_QUALITY_LEVELS.LOW,
    'standard': VIDEO_QUALITY_LEVELS.STANDARD,
    'high': VIDEO_QUALITY_LEVELS.HIGH,
    'ultra': VIDEO_QUALITY_LEVELS.ULTRA
};
