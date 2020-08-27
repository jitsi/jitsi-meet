// @flow

import { ReducerRegistry } from '../base/redux';

import { BLUR_ENABLED, BLUR_DISABLED } from './actionTypes';


ReducerRegistry.register('features/blur', (state = {}, action) => {

    switch (action.type) {
    case BLUR_ENABLED: {
        return {
            ...state,
            blurEnabled: true
        };
    }
    case BLUR_DISABLED: {
        return {
            ...state,
            blurEnabled: false
        };
    }
    }

    return state;
});
