/* @flow */

import { MEDIA_TYPE } from '../base/media';
import { ReducerRegistry } from '../base/redux';

import {
    DISABLE_MODERATION,
    ENABLE_MODERATION,
    LOCAL_PARTICIPANT_APPROVED
} from './actionTypes';

const initialState = {
    audioModerationEnabled: false,
    videoModerationEnabled: false
};

ReducerRegistry.register('features/av-moderation', (state = initialState, action) => {

    switch (action.type) {
    case DISABLE_MODERATION: {
        const newState = action.mediaType === MEDIA_TYPE.AUDIO
            ? {
                audioModerationEnabled: false,
                audioUnmuteApproved: undefined
            } : {
                videoModerationEnabled: false,
                videoUnmuteApproved: undefined
            };

        return {
            ...state,
            ...newState
        };
    }

    case ENABLE_MODERATION: {
        const newState = action.mediaType === MEDIA_TYPE.AUDIO
            ? { audioModerationEnabled: true } : { videoModerationEnabled: true };

        return {
            ...state,
            ...newState
        };
    }

    case LOCAL_PARTICIPANT_APPROVED: {
        const newState = action.mediaType === MEDIA_TYPE.AUDIO
            ? { audioUnmuteApproved: true } : { videoUnmuteApproved: true };

        return {
            ...state,
            ...newState
        };
    }
    }

    return state;
});
