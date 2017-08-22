import { ReducerRegistry } from '../base/redux';
import {
    SET_FILMSTRIP_REMOTE_VIDEOS_VISIBLITY,
    SET_FILMSTRIP_VISIBILITY
} from './actionTypes';

const DEFAULT_STATE = {
    /**
     * By default start with remote videos hidden for 1-on-1 mode and rely on
     * other logic to invoke an action to make them visible when needed.
     */
    remoteVideosVisible: false,

    visible: true
};

ReducerRegistry.register(
    'features/filmstrip',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case SET_FILMSTRIP_REMOTE_VIDEOS_VISIBLITY:
            return {
                ...state,
                remoteVideosVisible: action.remoteVideosVisible
            };
        case SET_FILMSTRIP_VISIBILITY:
            return {
                ...state,
                visible: action.visible
            };
        }

        return state;
    });
