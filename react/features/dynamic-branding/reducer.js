// @flow

import { ReducerRegistry } from '../base/redux';

import { SET_DYNAMIC_BRANDING_DATA, SET_DYNAMIC_BRANDING_READY } from './actionTypes';

/**
 * The name of the redux store/state property which is the root of the redux
 * state of the feature {@code dynamic-branding}.
 */
const STORE_NAME = 'features/dynamic-branding';

const DEFAULT_STATE = {
    backgroundColor: '',
    backgroundImageUrl: '',
    customizationReady: false,
    logoClickUrl: '',
    logoImageUrl: ''
};

/**
 * Reduces redux actions for the purposes of the feature {@code dynamic-branding}.
 */
ReducerRegistry.register(STORE_NAME, (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case SET_DYNAMIC_BRANDING_DATA: {
        const { backgroundColor, backgroundImageUrl, logoClickUrl, logoImageUrl } = action.value;

        return {
            backgroundColor,
            backgroundImageUrl,
            logoClickUrl,
            logoImageUrl,
            customizationReady: true
        };
    }
    case SET_DYNAMIC_BRANDING_READY:
        return {
            ...state,
            customizationReady: true
        };

    }

    return state;
});
