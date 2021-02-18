// @flow

import { ReducerRegistry } from '../base/redux';

import { BACKGROUND_ENABLED, SET_VIRTUAL_BACKGROUND } from './actionTypes';

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
ReducerRegistry.register('features/virtual-background', (state = {}, action) => {
    const { virtualSource, isVirtualBackground, backgroundEffectEnabled } = action;

    switch (action.type) {
    case SET_VIRTUAL_BACKGROUND: {
        return {
            ...state,
            virtualSource,
            isVirtualBackground
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
