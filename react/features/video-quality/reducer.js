// @flow

import { ReducerRegistry } from '../base/redux';

import { TOGGLE_VIDEO_QUALITY_DIALOG } from './actionTypes';

const DEFAULT_STATE = {
    isOpen: false
};

ReducerRegistry.register('features/video-quality', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case TOGGLE_VIDEO_QUALITY_DIALOG:
        return {
            ...state,
            isOpen: !state.isOpen
        };
    }

    return state;
});
