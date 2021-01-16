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
    LOW: 180
};

/**
 * Maps quality level names used in the config.videoQuality.minHeightForQualityLvl to the quality level constants used
 * by the application.
 * @type {Object}
 */
export const CFG_LVL_TO_APP_QUALITY_LVL = {
    'low': VIDEO_QUALITY_LEVELS.LOW,
    'standard': VIDEO_QUALITY_LEVELS.STANDARD,
    'high': VIDEO_QUALITY_LEVELS.HIGH
};
