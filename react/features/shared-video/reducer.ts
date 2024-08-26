import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    RESET_SHARED_VIDEO_STATUS,
    SET_DISABLE_BUTTON,
    SET_SHARED_VIDEO_STATUS,
    SET_URL_WHITELIST
} from './actionTypes';
import { YOUTUBE_URL_DOMAIN } from './constants';

const initialState = {};

export interface ISharedVideoState {
    disabled?: boolean;
    muted?: boolean;
    ownerId?: string;
    status?: string;
    time?: number;
    urlWhitelist?: Array<string>;
    videoUrl?: string;
    volume?: number;
}

/**
 * Reduces the Redux actions of the feature features/shared-video.
 */
ReducerRegistry.register<ISharedVideoState>('features/shared-video',
(state = initialState, action): ISharedVideoState => {
    const { videoUrl, status, time, ownerId, disabled, muted, volume } = action;

    switch (action.type) {
    case RESET_SHARED_VIDEO_STATUS:
        return initialState;
    case SET_SHARED_VIDEO_STATUS:
        return {
            ...state,
            muted,
            ownerId,
            status,
            time,
            videoUrl,
            volume
        };

    case SET_DISABLE_BUTTON:
        return {
            ...state,
            disabled
        };

    case SET_URL_WHITELIST: {
        return {
            ...state,
            urlWhitelist: [ YOUTUBE_URL_DOMAIN, ...action.urlWhitelist ]
        };
    }

    default:
        return state;
    }
});
