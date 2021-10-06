import { VIDEO_QUALITY_LEVELS } from '../../video-quality/constants';

/**
 * Determines the lastN value to be used for the conference based on the video quality selected.
 *
 * @param {string} qualityLevel - Quality level (height) selected.
 * @param {number} channelLastN - LastN value set for the whole conference.
 * @returns {number} LastN value applicable to the quality level specified.
 */
export function getLastNForQualityLevel(qualityLevel, channelLastN) {
    let lastN = channelLastN;

    const videoQualityLevels = Object.values(VIDEO_QUALITY_LEVELS);

    for (const lvl in videoQualityLevels) {
        if (videoQualityLevels.hasOwnProperty(lvl)
            && qualityLevel === videoQualityLevels[lvl]
            && lvl > 1) {
            lastN = Math.floor(channelLastN / Math.pow(2, lvl - 1));
        }
    }

    return lastN;
}

/**
 * Checks if the given Object is a correct last N limit mapping, coverts both keys and values to numbers and sorts
 * the keys in ascending order.
 *
 * @param {Object} lastNLimits - The Object to be verified.
 * @returns {undefined|Map<number, number>}
 */
export function validateLastNLimits(lastNLimits) {
    // Checks if only numbers are used
    if (typeof lastNLimits !== 'object'
        || !Object.keys(lastNLimits).length
        || Object.keys(lastNLimits)
            .find(limit => limit === null || isNaN(Number(limit))
                || lastNLimits[limit] === null || isNaN(Number(lastNLimits[limit])))) {
        return undefined;
    }

    // Converts to numbers and sorts the keys
    const sortedMapping = new Map();
    const orderedLimits = Object.keys(lastNLimits)
        .map(n => Number(n))
        .sort((n1, n2) => n1 - n2);

    for (const limit of orderedLimits) {
        sortedMapping.set(limit, Number(lastNLimits[limit]));
    }

    return sortedMapping;
}

/**
 * Returns "last N" value which corresponds to a level defined in the {@code lastNLimits} mapping. See
 * {@code config.js} for more detailed explanation on how the mapping is defined.
 *
 * @param {number} participantsCount - The current number of participants in the conference.
 * @param {Map<number, number>} [lastNLimits] - The mapping of number of participants to "last N" values. NOTE that
 * this function expects a Map that has been preprocessed by {@link validateLastNLimits}, because the keys must be
 * sorted in ascending order and both keys and values should be numbers.
 * @returns {number|undefined} - A "last N" number if there was a corresponding "last N" value matched with the number
 * of participants or {@code undefined} otherwise.
 */
export function limitLastN(participantsCount, lastNLimits) {
    if (!lastNLimits || !lastNLimits.keys) {
        return undefined;
    }

    let selectedLimit;

    for (const participantsN of lastNLimits.keys()) {
        if (participantsCount >= participantsN) {
            selectedLimit = participantsN;
        }
    }

    return selectedLimit ? lastNLimits.get(selectedLimit) : undefined;
}
