// @flow

import { ReducerRegistry } from '../base/redux';

import {
    SET_GENERICIFRAME_VISIBILITY_STATUS,
    SET_GENERICIFRAME_URL,
} from './actionTypes';

const DEFAULT_STATE = {
    /**
     * URL for the shared document.
     */
    iframeUrl: undefined,

    /**
     * Whether or not GenericIFrame is currently visible.
     *
     * @public
     * @type {boolean}
     */
    visible: false
};

/**
 * Reduces the Redux actions of the feature features/genericiframe.
 */
ReducerRegistry.register(
    'features/genericiframe',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case SET_GENERICIFRAME_VISIBILITY_STATUS:
            return {
                ...state,
                visible: action.visible
            };

        case SET_GENERICIFRAME_URL:
            return {
                ...state,
                iframeUrl: action.iframeUrl
            };

        default:
            return state;
        }
    }
);
