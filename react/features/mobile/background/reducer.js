import { ReducerRegistry } from '../../base/redux';

import {
    _SET_APP_STATE_LISTENER,
    _SET_BACKGROUND_VIDEO_MUTED,
    APP_STATE_CHANGED
} from './actionTypes';

ReducerRegistry.register('features/background', (state = {}, action) => {
    switch (action.type) {
    case _SET_APP_STATE_LISTENER:
        return {
            ...state,
            appStateListener: action.listener
        };

    case _SET_BACKGROUND_VIDEO_MUTED:
        return {
            ...state,
            videoMuted: action.muted
        };

    case APP_STATE_CHANGED:
        return {
            ...state,
            appState: action.appState
        };
    }

    return state;
});
