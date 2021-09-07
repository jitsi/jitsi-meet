// @flow

import { PersistenceRegistry, ReducerRegistry } from '../base/redux';

import { BACKGROUND_ENABLED, SET_VIRTUAL_BACKGROUND } from './actionTypes';
import { VIRTUAL_BACKGROUND_TYPE } from './constants';

const STORE_NAME = 'features/virtual-background';

/**
 * Reduces redux actions which activate/deactivate virtual background image, or
 * indicate if the virtual image background is activated/deactivated. The
 * backgroundEffectEnabled flag indicate if virtual background effect is activated.
 *
 * @param {State} state - The current redux state.
 * @param {Action} action - The redux action to reduce.
 * @param {string} action.type - The type of the redux action to reduce..
 * @returns {State} The next redux state that is the result of reducing the
 * specified action.
 */
ReducerRegistry.register(STORE_NAME, (state = {}, action) => {
    const { virtualSource, backgroundEffectEnabled, blurValue, backgroundType, selectedThumbnail, dragAndDropOptions }
      = action;

    /**
     * Sets up the persistence of the feature {@code virtual-background}.
     */
    PersistenceRegistry.register(STORE_NAME, state.backgroundType !== VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE
        && state.backgroundType !== VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE_TRANSFORM
        && state.backgroundType !== VIRTUAL_BACKGROUND_TYPE.TRANSPARENT_PREVIEW);

    switch (action.type) {
    case SET_VIRTUAL_BACKGROUND: {
        return {
            ...state,
            virtualSource,
            blurValue,
            backgroundType,
            selectedThumbnail,
            dragAndDropOptions
        };
    }
    case BACKGROUND_ENABLED: {
        return {
            ...state,
            backgroundEffectEnabled
        };
    }
    }

    return state;
});
