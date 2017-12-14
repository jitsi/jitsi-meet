// @flow

import {
    HIDE_APP_SETTINGS,
    SHOW_APP_SETTINGS
} from './actionTypes';

import { ReducerRegistry } from '../base/redux';

const DEFAULT_STATE = {
    visible: false
};

ReducerRegistry.register(
    'features/app-settings', (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case HIDE_APP_SETTINGS:
            return {
                ...state,
                visible: false
            };

        case SHOW_APP_SETTINGS:
            return {
                ...state,
                visible: true
            };
        }

        return state;
    });
