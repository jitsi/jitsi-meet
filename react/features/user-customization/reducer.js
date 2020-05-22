// @flow

import { ReducerRegistry } from '../base/redux';

import { SET_USER_CUSTOM_DATA } from './actionTypes';

/**
 * The name of the redux store/state property which is the root of the redux
 * state of the feature {@code user-customization}.
 */
const STORE_NAME = 'features/user-customization';

const DEFAULT_STATE = {
    backgroundColor: '',
    backgroundImageUrl: '',
    customizationReady: false,
    logoClickUrl: '',
    logoImageUrl: ''
};

/**
 * Reduces redux actions for the purposes of the feature {@code user-customization}.
 */
ReducerRegistry.register(STORE_NAME, (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case SET_USER_CUSTOM_DATA:
        return {
            ...state,
            ...action.value,
            customizationReady: true
        };
    }

    return state;
});
