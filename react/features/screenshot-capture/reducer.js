// @flow

import { ReducerRegistry } from '../base/redux';
import { PersistenceRegistry } from '../base/storage';

import { SET_SCREENSHOT_CAPTURE } from './actionTypes';

PersistenceRegistry.register('features/screnshot-capture', true, {
    capturesEnabled: false
});

ReducerRegistry.register('features/screenshot-capture', (state = {}, action) => {
    switch (action.type) {
    case SET_SCREENSHOT_CAPTURE: {
        return {
            ...state,
            capturesEnabled: action.payload
        };
    }
    }

    return state;
});
