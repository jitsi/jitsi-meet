import ReducerRegistry from '../base/redux/ReducerRegistry';
import { assign } from '../base/redux/functions';

import { MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED } from './actionTypes';


export interface IOverlayState {
    browser?: string;
    fatalError?: {
        details: Object;
        message?: string;
        name?: string;
    };
    isMediaPermissionPromptVisible?: boolean;
}

/**
 * Reduces the redux actions of the feature overlay.
 *
 * FIXME: these pieces of state should probably be in a different place.
 */
ReducerRegistry.register<IOverlayState>('features/overlay', (state = {}, action): IOverlayState => {
    switch (action.type) {
    case MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED:
        return _mediaPermissionPromptVisibilityChanged(state, action);
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
        state: IOverlayState,
        { browser, isVisible }: { browser?: string; isVisible?: boolean; }) {
    return assign(state, {
        browser,
        isMediaPermissionPromptVisible: isVisible
    });
}
