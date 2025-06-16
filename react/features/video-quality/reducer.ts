import { SET_CONFIG } from '../base/config/actionTypes';
import { IConfig } from '../base/config/configType';
import PersistenceRegistry from '../base/redux/PersistenceRegistry';
import ReducerRegistry from '../base/redux/ReducerRegistry';
import { set } from '../base/redux/functions';

import {
    SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_LARGE_VIDEO,
    SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_SCREEN_SHARING_FILMSTRIP,
    SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_STAGE_FILMSTRIP,
    SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_TILE_VIEW,
    SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_VERTICAL_FILMSTRIP,
    SET_PREFERRED_VIDEO_QUALITY
} from './actionTypes';
import { VIDEO_QUALITY_LEVELS } from './constants';
import { validateMinHeightForQualityLvl } from './functions';
import logger from './logger';

const DEFAULT_STATE = {
    maxReceiverVideoQualityForLargeVideo: VIDEO_QUALITY_LEVELS.ULTRA,
    maxReceiverVideoQualityForScreenSharingFilmstrip: VIDEO_QUALITY_LEVELS.HIGH,
    maxReceiverVideoQualityForStageFilmstrip: VIDEO_QUALITY_LEVELS.HIGH,
    maxReceiverVideoQualityForTileView: VIDEO_QUALITY_LEVELS.STANDARD,
    maxReceiverVideoQualityForVerticalFilmstrip: VIDEO_QUALITY_LEVELS.LOW,
    minHeightForQualityLvl: new Map(),
    preferredVideoQuality: VIDEO_QUALITY_LEVELS.ULTRA
};


Object.values(VIDEO_QUALITY_LEVELS).sort()
    .forEach(value => {
        if (value > VIDEO_QUALITY_LEVELS.NONE) {
            DEFAULT_STATE.minHeightForQualityLvl.set(value, value);
        }
    });

export interface IVideoQualityState {
    maxReceiverVideoQualityForLargeVideo: number;
    maxReceiverVideoQualityForScreenSharingFilmstrip: number;
    maxReceiverVideoQualityForStageFilmstrip: number;
    maxReceiverVideoQualityForTileView: number;
    maxReceiverVideoQualityForVerticalFilmstrip: number;
    minHeightForQualityLvl: Map<number, number>;
    preferredVideoQuality: number;
}

export interface IVideoQualityPersistedState {
    persistedPrefferedVideoQuality?: number;
}


// When the persisted state is initialized the current state (for example the default state) is erased.
// In order to workaround this issue we need additional state for the persisted properties.
PersistenceRegistry.register('features/video-quality-persistent-storage');

ReducerRegistry.register<IVideoQualityPersistedState>('features/video-quality-persistent-storage',
(state = {}, action): IVideoQualityPersistedState => {
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

ReducerRegistry.register<IVideoQualityState>('features/video-quality',
(state = DEFAULT_STATE, action): IVideoQualityState => {
    switch (action.type) {
    case SET_CONFIG:
        return _setConfig(state, action);
    case SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_LARGE_VIDEO:
        return set(state,
            'maxReceiverVideoQualityForLargeVideo',
            action.maxReceiverVideoQuality);
    case SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_SCREEN_SHARING_FILMSTRIP:
        return set(state,
            'maxReceiverVideoQualityForScreenSharingFilmstrip',
            action.maxReceiverVideoQuality);
    case SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_STAGE_FILMSTRIP:
        return set(
            state,
            'maxReceiverVideoQualityForStageFilmstrip',
            action.maxReceiverVideoQuality);
    case SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_TILE_VIEW:
        return set(
            state,
            'maxReceiverVideoQualityForTileView',
            action.maxReceiverVideoQuality);
    case SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_VERTICAL_FILMSTRIP:
        return set(
            state,
            'maxReceiverVideoQualityForVerticalFilmstrip',
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
function _setConfig(state: IVideoQualityState, { config }: { config: IConfig; }) {
    const configuredMap = config?.videoQuality?.minHeightForQualityLvl;
    const convertedMap = validateMinHeightForQualityLvl(configuredMap);

    if (configuredMap && !convertedMap) {
        logger.error('Invalid config value videoQuality.minHeightForQualityLvl');
    }

    return convertedMap ? set(state, 'minHeightForQualityLvl', convertedMap) : state;
}
