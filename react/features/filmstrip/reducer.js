import { ReducerRegistry } from '../base/redux';
import {
    SET_FILMSTRIP_REMOTE_VIDEOS_COUNT,
    SET_FILMSTRIP_REMOTE_VIDEOS_VISIBLITY,
    SET_FILMSTRIP_VISIBILITY
} from './actionTypes';

const DEFAULT_STATE = {
    remoteVideosCount: 0,
    remoteVideosVisible: true,
    visible: true
};

ReducerRegistry.register(
    'features/filmstrip',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case SET_FILMSTRIP_REMOTE_VIDEOS_COUNT:
            return {
                ...state,
                remoteVideosCount: action.remoteVideosCount
            };
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
