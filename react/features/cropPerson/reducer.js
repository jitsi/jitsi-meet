// @flow

import { ReducerRegistry } from '../base/redux';
import { PersistenceRegistry } from '../base/storage';

import { CROP_ENABLED, CROP_DISABLED } from './actionTypes';

PersistenceRegistry.register('features/cropPerson', true, {
    cropEnabled: false
});

ReducerRegistry.register('features/cropPerson', (state = {}, action) => {

    switch (action.type) {
    case CROP_ENABLED: {
        return {
            ...state,
            cropEnabled: true
        };
    }
    case CROP_DISABLED: {
        return {
            ...state,
            cropEnabled: false
        };
    }
    }

    return state;
});
