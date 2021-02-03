// @flow

import { CFG_LVL_TO_APP_QUALITY_LVL, VIDEO_QUALITY_LEVELS } from './constants';

const { LOW, STANDARD, HIGH, ULTRA } = VIDEO_QUALITY_LEVELS;
const videoQualityLevels = [ LOW, STANDARD, HIGH, ULTRA ];

/**
 * Finds the nearest video quality level to the passed video quality.
 *
 * @param {number} videoQuality - The video quality.
 * @returns {number|undefined} - The found quality level.
 */
export function findNearestQualityLevel(videoQuality: number) {
    for (let i = 0; i < videoQualityLevels.length; i++) {
        const level = videoQualityLevels[i];

        if (level >= videoQuality) {
            return level;
        }
    }

    return undefined;
}

/**
 * Selects {@code VIDEO_QUALITY_LEVELS} for the given {@link availableHeight} and threshold to quality mapping.
 *
 * @param {number} availableHeight - The height to which a matching video quality level should be found.
 * @param {Map<number, number>} heightToLevel - The threshold to quality level mapping. The keys are sorted in the
 * ascending order.
 * @returns {number} The matching value from {@code VIDEO_QUALITY_LEVELS}.
 */
export function getReceiverVideoQualityLevel(availableHeight: number, heightToLevel: Map<number, number>): number {
    let selectedLevel = VIDEO_QUALITY_LEVELS.LOW;

    for (const [ levelThreshold, level ] of heightToLevel.entries()) {
        if (availableHeight >= levelThreshold) {
            selectedLevel = level;
        }
    }

    return selectedLevel;
}

/**
 * Converts {@code Object} passed in the config which represents height thresholds to vide quality level mapping to
 * a {@code Map}.
 *
 * @param {Object} minHeightForQualityLvl - The 'config.videoQuality.minHeightForQualityLvl' Object from
 * the configuration. See config.js for more details.
 * @returns {Map<number, number>|undefined} - A mapping of minimal thumbnail height required for given quality level or
 * {@code undefined} if the map contains invalid values.
 */
export function validateMinHeightForQualityLvl(minHeightForQualityLvl: Object): ?Map<number, number> {
    if (typeof minHeightForQualityLvl !== 'object'
        || Object.keys(minHeightForQualityLvl).map(lvl => Number(lvl))
            .find(lvl => lvl === null || isNaN(lvl) || lvl < 0)) {
        return undefined;
    }

    const levelsSorted
        = Object.keys(minHeightForQualityLvl)
            .map(k => Number(k))
            .sort((a, b) => a - b);
    const map = new Map();

    for (const level of levelsSorted) {
        const configQuality = minHeightForQualityLvl[level];
        const appQuality = CFG_LVL_TO_APP_QUALITY_LVL[configQuality];

        if (!appQuality) {
            return undefined;
        }

        map.set(level, appQuality);
    }

    return map;
}
