// @flow

import { ReducerRegistry } from '../base/redux';
import { PersistenceRegistry } from '../base/storage';

import { BLUR_ENABLED, BLUR_DISABLED } from './actionTypes';

PersistenceRegistry.register('features/blur', true, {
    blurEnabled: false
});

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
