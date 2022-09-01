import { SET_CONFIG } from '../base/config/actionTypes';
import { IConfig } from '../base/config/configType';
import PersistenceRegistry from '../base/redux/PersistenceRegistry';
import ReducerRegistry from '../base/redux/ReducerRegistry';
import { set } from '../base/redux/functions';

import { SET_MAX_RECEIVER_VIDEO_QUALITY, SET_PREFERRED_VIDEO_QUALITY } from './actionTypes';
import { VIDEO_QUALITY_LEVELS } from './constants';
/* eslint-disable-next-line lines-around-comment */
// @ts-ignore
import { validateMinHeightForQualityLvl } from './functions';
import logger from './logger';

const DEFAULT_STATE = {
    maxReceiverVideoQuality: VIDEO_QUALITY_LEVELS.ULTRA,
    minHeightForQualityLvl: new Map(),
    preferredVideoQuality: VIDEO_QUALITY_LEVELS.ULTRA
};

DEFAULT_STATE.minHeightForQualityLvl.set(360, VIDEO_QUALITY_LEVELS.STANDARD);
DEFAULT_STATE.minHeightForQualityLvl.set(720, VIDEO_QUALITY_LEVELS.HIGH);

export interface IVideoQualityState {
    maxReceiverVideoQuality: number;
    minHeightForQualityLvl: Map<number, number>;
    preferredVideoQuality: number;
}

export interface IVideoQualityPersistedState {
    persistedPrefferedVideoQuality?: number;
}


// When the persisted state is initialized the current state (for example the default state) is erased.
// In order to workaround this issue we need additional state for the persisted properties.
PersistenceRegistry.register('features/video-quality-persistent-storage');

ReducerRegistry.register('features/video-quality-persistent-storage',
(state: IVideoQualityPersistedState = {}, action): IVideoQualityPersistedState => {
    switch (action.type) {
    case SET_PREFERRED_VIDEO_QUALITY: {
        const { preferredVideoQuality } = action;

        return {
            ...state,
            persistedPrefferedVideoQuality: preferredVideoQuality
        };
    }
    }

    return state;
});

ReducerRegistry.register('features/video-quality',
(state: IVideoQualityState = DEFAULT_STATE, action): IVideoQualityState => {
    switch (action.type) {
    case SET_CONFIG:
        return _setConfig(state, action);
    case SET_MAX_RECEIVER_VIDEO_QUALITY:
        return set(
            state,
            'maxReceiverVideoQuality',
            action.maxReceiverVideoQuality);
    case SET_PREFERRED_VIDEO_QUALITY: {
        const { preferredVideoQuality } = action;

        return {
            ...state,
            preferredVideoQuality
        };
    }
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
function _setConfig(state: IVideoQualityState, { config }: { config: IConfig }) {
    const configuredMap = config?.videoQuality?.minHeightForQualityLvl;
    const convertedMap = validateMinHeightForQualityLvl(configuredMap);

    if (configuredMap && !convertedMap) {
        logger.error('Invalid config value videoQuality.minHeightForQualityLvl');
    }

    return convertedMap ? set(state, 'minHeightForQualityLvl', convertedMap) : state;
}
