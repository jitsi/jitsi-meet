// @flow

import { CONFIG_WILL_LOAD, LOAD_CONFIG_ERROR, SET_CONFIG } from '../base/config';
import { assign, ReducerRegistry, set } from '../base/redux';

import {
    MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED,
    SET_FATAL_ERROR
} from './actionTypes';

/**
 * Reduces the redux actions of the feature overlay.
 *
 * FIXME: these pieces of state should probably be in a different place.
 */
ReducerRegistry.register('features/overlay', (state = { }, action) => {
    switch (action.type) {
    case CONFIG_WILL_LOAD:
        return _setShowLoadConfigOverlay(state, Boolean(action.room));

    case LOAD_CONFIG_ERROR:
    case SET_CONFIG:
        return _setShowLoadConfigOverlay(false);

    case MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED:
        return _mediaPermissionPromptVisibilityChanged(state, action);

    case SET_FATAL_ERROR:
        return _setFatalError(state, action);

    }

    return state;
});

/**
 * Reduces a specific redux action MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED of
 * the feature overlay.
 *
 * @param {Object} state - The redux state of the feature overlay.
 * @param {Action} action - The redux action to reduce.
 * @private
 * @returns {Object} The new state of the feature overlay after the reduction of
 * the specified action.
 */
function _mediaPermissionPromptVisibilityChanged(
        state,
        { browser, isVisible }) {
    return assign(state, {
        browser,
        isMediaPermissionPromptVisible: isVisible
    });
}

/**
 * Sets the {@code LoadConfigOverlay} overlay visible or not.
 *
 * @param {Object} state - The redux state of the feature overlay.
 * @param {boolean} show - Whether to show or not the overlay.
 * @returns {Object} The new state of the feature overlay after the reduction of
 * the specified action.
 */
function _setShowLoadConfigOverlay(state, show) {
    return set(state, 'loadConfigOverlayVisible', show);
}

/**
 * Reduces a specific redux action {@code SET_FATAL_ERROR} of the feature
 * overlay.
 *
 * @param {Object} state - The redux state of the feature overlay.
 * @param {Error} fatalError - If the value is set it indicates that a fatal
 * error has occurred and that the reload screen is to be displayed.
 * @returns {Object}
 * @private
 */
function _setFatalError(state, { fatalError }) {
    return set(state, 'fatalError', fatalError);
}
