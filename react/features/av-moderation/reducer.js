/* @flow */

import { MEDIA_TYPE } from '../base/media/constants';
import { ReducerRegistry } from '../base/redux';

import {
    DISABLE_MODERATION,
    DISMISS_PENDING_PARTICIPANT,
    ENABLE_MODERATION,
    LOCAL_PARTICIPANT_APPROVED,
    PARTICIPANT_APPROVED,
    PARTICIPANT_PENDING_AUDIO
} from './actionTypes';

const initialState = {
    audioModerationEnabled: false,
    videoModerationEnabled: false,
    audioWhitelist: {},
    videoWhitelist: {},
    pendingAudio: [],
    pendingVideo: []
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
            ...newState,
            audioWhitelist: {},
            videoWhitelist: {},
            pendingAudio: [],
            pendingVideo: []
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

    case PARTICIPANT_PENDING_AUDIO: {
        const { id } = action;

        // Add participant to pendigAudio array only if it's not already added
        if (!state.pendingAudio.find(pending => pending === id)) {
            const updated = [ ...state.pendingAudio ];

            updated.push(id);

            return {
                ...state,
                pendingAudio: updated
            };
        }

        return state;
    }

    case DISMISS_PENDING_PARTICIPANT: {
        const { id, mediaType } = action;

        if (mediaType === MEDIA_TYPE.AUDIO) {
            return {
                ...state,
                pendingAudio: state.pendingAudio.filter(pending => pending !== id)
            };
        }

        if (mediaType === MEDIA_TYPE.VIDEO) {
            return {
                ...state,
                pendingAudio: state.pendingVideo.filter(pending => pending !== id)
            };
        }

        return state;
    }

    case PARTICIPANT_APPROVED: {
        const { mediaType, id } = action;

        if (mediaType === MEDIA_TYPE.AUDIO) {
            return {
                ...state,
                audioWhitelist: {
                    ...state.audioWhitelist,
                    [id]: true
                }
            };
        }

        if (mediaType === MEDIA_TYPE.VIDEO) {
            return {
                ...state,
                videoWhitelist: {
                    ...state.videoWhitelist,
                    [id]: true
                }
            };
        }

        return state;
    }

    }

    return state;
});
