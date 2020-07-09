// @flow

import { PersistenceRegistry, ReducerRegistry } from '../base/redux';

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
