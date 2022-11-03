import { MEDIA_TYPE } from '../base/media/constants';
import type { MediaType } from '../base/media/constants';
import {
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED
} from '../base/participants/actionTypes';
import { IParticipant } from '../base/participants/types';
import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    DISABLE_MODERATION,
    DISMISS_PENDING_PARTICIPANT,
    ENABLE_MODERATION,
    LOCAL_PARTICIPANT_APPROVED,
    LOCAL_PARTICIPANT_REJECTED,
    PARTICIPANT_APPROVED,
    PARTICIPANT_PENDING_AUDIO,
    PARTICIPANT_REJECTED
} from './actionTypes';
import { MEDIA_TYPE_TO_PENDING_STORE_KEY } from './constants';

const initialState = {
    audioModerationEnabled: false,
    videoModerationEnabled: false,
    audioWhitelist: {},
    videoWhitelist: {},
    pendingAudio: [],
    pendingVideo: []
};

export interface IAVModerationState {
    audioModerationEnabled: boolean;
    audioUnmuteApproved?: boolean | undefined;
    audioWhitelist: { [id: string]: boolean; };
    pendingAudio: Array<{ id: string; }>;
    pendingVideo: Array<{ id: string; }>;
    videoModerationEnabled: boolean;
    videoUnmuteApproved?: boolean | undefined;
    videoWhitelist: { [id: string]: boolean; };
}

/**
 * Updates a participant in the state for the specified media type.
 *
 * @param {MediaType} mediaType - The media type.
 * @param {Object} participant - Information about participant to be modified.
 * @param {Object} state - The current state.
 * @private
 * @returns {boolean} - Whether state instance was modified.
 */
function _updatePendingParticipant(mediaType: MediaType, participant: IParticipant, state: IAVModerationState) {
    let arrayItemChanged = false;
    const storeKey = MEDIA_TYPE_TO_PENDING_STORE_KEY[mediaType];
    const arr = state[storeKey];
    const newArr = arr.map((pending: { id: string; }) => {
        if (pending.id === participant.id) {
            arrayItemChanged = true;

            return {
                ...pending,
                ...participant
            };
        }

        return pending;
    });

    if (arrayItemChanged) {
        state[storeKey] = newArr;

        return true;
    }

    return false;
}

ReducerRegistry.register<IAVModerationState>('features/av-moderation',
(state = initialState, action): IAVModerationState => {
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

    case LOCAL_PARTICIPANT_REJECTED: {
        const newState = action.mediaType === MEDIA_TYPE.AUDIO
            ? { audioUnmuteApproved: false } : { videoUnmuteApproved: false };

        return {
            ...state,
            ...newState
        };
    }

    case PARTICIPANT_PENDING_AUDIO: {
        const { participant } = action;

        // Add participant to pendingAudio array only if it's not already added
        if (!state.pendingAudio.find(pending => pending.id === participant.id)) {
            const updated = [ ...state.pendingAudio ];

            updated.push(participant);

            return {
                ...state,
                pendingAudio: updated
            };
        }

        return state;
    }

    case PARTICIPANT_UPDATED: {
        const participant = action.participant;
        const { audioModerationEnabled, videoModerationEnabled } = state;
        let hasStateChanged = false;

        // skips changing the reference of pendingAudio or pendingVideo,
        // if there is no change in the elements
        if (audioModerationEnabled) {
            hasStateChanged = _updatePendingParticipant(MEDIA_TYPE.AUDIO, participant, state);
        }

        if (videoModerationEnabled) {
            hasStateChanged = hasStateChanged || _updatePendingParticipant(MEDIA_TYPE.VIDEO, participant, state);
        }

        // If the state has changed we need to return a new object reference in order to trigger subscriber updates.
        if (hasStateChanged) {
            return {
                ...state
            };
        }

        return state;
    }
    case PARTICIPANT_LEFT: {
        const participant = action.participant;
        const { audioModerationEnabled, videoModerationEnabled } = state;
        let hasStateChanged = false;

        // skips changing the reference of pendingAudio or pendingVideo,
        // if there is no change in the elements
        if (audioModerationEnabled) {
            const newPendingAudio = state.pendingAudio.filter(pending => pending.id !== participant.id);

            if (state.pendingAudio.length !== newPendingAudio.length) {
                state.pendingAudio = newPendingAudio;
                hasStateChanged = true;
            }
        }

        if (videoModerationEnabled) {
            const newPendingVideo = state.pendingVideo.filter(pending => pending.id !== participant.id);

            if (state.pendingVideo.length !== newPendingVideo.length) {
                state.pendingVideo = newPendingVideo;
                hasStateChanged = true;
            }
        }

        // If the state has changed we need to return a new object reference in order to trigger subscriber updates.
        if (hasStateChanged) {
            return {
                ...state
            };
        }

        return state;
    }

    case DISMISS_PENDING_PARTICIPANT: {
        const { id, mediaType } = action;

        if (mediaType === MEDIA_TYPE.AUDIO) {
            return {
                ...state,
                pendingAudio: state.pendingAudio.filter(pending => pending.id !== id)
            };
        }

        if (mediaType === MEDIA_TYPE.VIDEO) {
            return {
                ...state,
                pendingVideo: state.pendingVideo.filter(pending => pending.id !== id)
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

    case PARTICIPANT_REJECTED: {
        const { mediaType, id } = action;

        if (mediaType === MEDIA_TYPE.AUDIO) {
            return {
                ...state,
                audioWhitelist: {
                    ...state.audioWhitelist,
                    [id]: false
                }
            };
        }

        if (mediaType === MEDIA_TYPE.VIDEO) {
            return {
                ...state,
                videoWhitelist: {
                    ...state.videoWhitelist,
                    [id]: false
                }
            };
        }

        return state;
    }

    }

    return state;
});
