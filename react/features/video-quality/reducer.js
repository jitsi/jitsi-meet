import { VIDEO_QUALITY_LEVELS } from '../base/conference';
import { SET_CONFIG } from '../base/config';
import { ReducerRegistry, set } from '../base/redux';

import { validateMinHeightForQualityLvl } from './functions';
import logger from './logger';

const DEFAULT_STATE = {
    minHeightForQualityLvl: new Map()
};

DEFAULT_STATE.minHeightForQualityLvl.set(360, VIDEO_QUALITY_LEVELS.STANDARD);
DEFAULT_STATE.minHeightForQualityLvl.set(720, VIDEO_QUALITY_LEVELS.HIGH);

ReducerRegistry.register('features/base/videoquality', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case SET_CONFIG:
        return _setConfig(state, action);
    }

    return state;
});

/**
 * Extracts the height to quality level mapping from the new config.
 *
 * @param {Object} state - The Redux state of feature base/lastn.
 * @param {Action} action - The Redux action SET_CONFIG to reduce.
 * @private
 * @returns {Object} The new state after the reduction of the specified action.
 */
function _setConfig(state, { config }) {
    const configuredMap = config?.videoQuality?.minHeightForQualityLvl;
    const convertedMap = validateMinHeightForQualityLvl(configuredMap);

    if (configuredMap && !convertedMap) {
        logger.error('Invalid config value videoQuality.minHeightForQualityLvl');
    }

    return convertedMap ? set(state, 'minHeightForQualityLvl', convertedMap) : state;
}
