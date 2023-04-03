import { VIDEO_QUALITY_LEVELS } from '../../video-quality/constants';

/**
 * Determines the lastN value to be used for the conference based on the video quality selected.
 *
 * @param {string} qualityLevel - Quality level (height) selected.
 * @param {number} channelLastN - LastN value set for the whole conference.
 * @returns {number} LastN value applicable to the quality level specified.
 */
export function getLastNForQualityLevel(qualityLevel: number, channelLastN: number) {
    let lastN = channelLastN;

    const videoQualityLevels = Object.values(VIDEO_QUALITY_LEVELS);

    for (const lvl in videoQualityLevels) {
        if (videoQualityLevels.hasOwnProperty(lvl)
            && qualityLevel === videoQualityLevels[lvl]
            && Number(lvl) > 1) {
            lastN = Math.floor(channelLastN / Math.pow(2, Number(lvl) - 1));
        }
    }

    return lastN;
}
