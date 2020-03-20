// @flow

import { ReducerRegistry } from '../base/redux';

import {
    SET_AUDIO_SETTINGS_VISIBILITY,
    SET_SETTINGS_VIEW_VISIBLE,
    SET_VIDEO_SETTINGS_VISIBILITY
} from './actionTypes';

ReducerRegistry.register('features/settings', (state = {}, action) => {
    switch (action.type) {
    case SET_SETTINGS_VIEW_VISIBLE:
        return {
            ...state,
            visible: action.visible
        };
    case SET_AUDIO_SETTINGS_VISIBILITY:
        return {
            ...state,
            audioSettingsVisible: action.value
        };
    case SET_VIDEO_SETTINGS_VISIBILITY:
        return {
            ...state,
            videoSettingsVisible: action.value
        };
    }

    return state;
});
