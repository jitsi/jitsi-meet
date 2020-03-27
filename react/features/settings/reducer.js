// @flow

import { ReducerRegistry } from '../base/redux';

import { SET_SETTINGS_VIEW_VISIBLE } from './actionTypes';

ReducerRegistry.register('features/settings', (state = {}, action) => {
    switch (action.type) {
    case SET_SETTINGS_VIEW_VISIBLE:
        return {
            ...state,
            visible: action.visible
        };
    }

    return state;
});
