import { UPDATE_CONFERENCE_METADATA } from '../base/conference/actionTypes';
import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    RESET_SHARED_VIDEO_STATUS,
    SET_ALLOWED_URL_DOMAINS,
    SET_CONFIRM_SHOW_VIDEO,
    SET_SHARED_VIDEO_STATUS
} from './actionTypes';
import { DEFAULT_ALLOWED_URL_DOMAINS } from './constants';

const initialState = {
    allowedUrlDomains: DEFAULT_ALLOWED_URL_DOMAINS
};

export interface ISharedVideoState {
    allowedUrlDomains: Array<string>;
    confirmShowVideo?: boolean;
    muted?: boolean;
    ownerId?: string;
    sharedVideoRestricted?: boolean;
    status?: string;
    time?: number;
    videoUrl?: string;
    volume?: number;
}

/**
 * Reduces the Redux actions of the feature features/shared-video.
 */
ReducerRegistry.register<ISharedVideoState>('features/shared-video',
(state = initialState, action): ISharedVideoState => {
    const { videoUrl, status, time, ownerId, muted, volume } = action;

    switch (action.type) {
    case RESET_SHARED_VIDEO_STATUS:
        return {
            ...initialState,
            allowedUrlDomains: state.allowedUrlDomains,
            sharedVideoRestricted: state.sharedVideoRestricted
        };
    case SET_CONFIRM_SHOW_VIDEO: {
        return {
            ...state,
            confirmShowVideo: action.value
        };
    }
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

    case SET_ALLOWED_URL_DOMAINS: {
        return {
            ...state,
            allowedUrlDomains: action.allowedUrlDomains
        };
    }

    case UPDATE_CONFERENCE_METADATA: {
        const { metadata } = action;

        if (metadata?.permissions) {
            return {
                ...state,
                sharedVideoRestricted: Boolean(metadata.permissions.sharedVideoRestricted)
            };
        }

        return state;
    }

    default:
        return state;
    }
});
