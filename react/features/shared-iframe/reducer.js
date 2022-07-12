// @flow

import { ReducerRegistry } from '../base/redux';

import {
    RESET_SHARED_IFRAME_STATUS,
    SET_SHARED_IFRAME_STATUS,
    SET_DISABLE_SHARED_IFRAME_BUTTON,
    ONLY_UPDATE_SHARED_IFRAME_STATUS
} from './actionTypes';

/**
 * Reduces the Redux actions of the feature features/shared-iframe.
 */
ReducerRegistry.register('features/shared-iframe', (state = {}, action) => {
    const { shareKey, iFrameTemplateUrl, isSharing, ownerId, disabled, statePatch } = action;

    switch (action.type) {
    case ONLY_UPDATE_SHARED_IFRAME_STATUS:
        return {
            ...state,
            ...statePatch
        };
    case RESET_SHARED_IFRAME_STATUS:
        return {
            ...state,
            iframes: {
                ...state?.iframes,
                [shareKey]: { }
            }
        };
    case SET_SHARED_IFRAME_STATUS:
        return {
            ...state,
            iframes: {
                ...state?.iframes,
                [shareKey]: {
                    ...state?.iframes?.[shareKey],
                    ownerId,
                    isSharing,
                    iFrameTemplateUrl
                }
            }
        };

    case SET_DISABLE_SHARED_IFRAME_BUTTON:
        return {
            ...state,
            iframes: {
                ...state?.iframes,
                [shareKey]: {
                    ...state?.iframes?.[shareKey],
                    disabled
                }
            }
        };

    default:
        return state;
    }
});
