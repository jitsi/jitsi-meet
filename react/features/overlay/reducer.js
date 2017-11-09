// @flow

import { assign, ReducerRegistry, set } from '../base/redux';

import {
    MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED,
    SUSPEND_DETECTED
} from './actionTypes';

/**
 * Reduces the redux actions of the feature overlay.
 *
 * FIXME: these pieces of state should probably be in a different place.
 */
ReducerRegistry.register('features/overlay', (state = {}, action) => {
    switch (action.type) {
    case MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED:
        return _mediaPermissionPromptVisibilityChanged(state, action);

    case SUSPEND_DETECTED:
        return _suspendDetected(state);
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
 * Reduces a specific redux action SUSPEND_DETECTED of the feature overlay.
 *
 * @param {Object} state - The redux state of the feature overlay.
 * @private
 * @returns {Object} The new state of the feature overlay after the reduction of
 * the specified action.
 */
function _suspendDetected(state) {
    return set(state, 'suspendDetected', true);
}
