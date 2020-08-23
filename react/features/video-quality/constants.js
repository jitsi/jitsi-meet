import { VIDEO_QUALITY_LEVELS } from '../base/conference';

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
