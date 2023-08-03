import ReducerRegistry from '../base/redux/ReducerRegistry';
import { RESET_SHARED_VIDEO_STATUS, SET_DISABLE_BUTTON, SET_SHARED_VIDEO_STATUS } from './actionTypes';

const initialState = {};

export interface ISharedVideoState {
    disabled?: boolean;
    muted?: boolean;
    ownerId?: string;
    status?: string;
    time?: number;
    videoUrl?: string;
    volume?: number;
    previousOwnerId?: string;
}

/**
 * Reduces the Redux actions of the feature features/shared-video.
 */
ReducerRegistry.register<ISharedVideoState>('features/shared-video',
(state = initialState, action): ISharedVideoState => {
    const { videoUrl, status, time, ownerId, disabled, muted, volume, previousOwnerId } = action;

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
            volume,
            previousOwnerId
        };

    case SET_DISABLE_BUTTON:
        return {
            ...state,
            disabled
        };

    default:
        return state;
    }
});