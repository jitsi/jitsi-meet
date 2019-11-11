// @flow

import { ReducerRegistry } from '../base/redux';
import { PersistenceRegistry } from '../base/storage';
import { SET_CROP_ENABLED } from './actionTypes';

PersistenceRegistry.register('features/cropPerson', true, {
    cropEnabled: false
});

ReducerRegistry.register('features/cropPerson', (state = {}, action) => {

    if (action.type === SET_CROP_ENABLED) {
        return {
            ...state,
            cropEnabled: action.enabled
        };
    }

    return state;
});
