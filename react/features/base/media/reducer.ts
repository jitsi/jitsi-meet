import { AnyAction, combineReducers } from 'redux';

import { CONFERENCE_FAILED, CONFERENCE_LEFT } from '../conference/actionTypes';
import ReducerRegistry from '../redux/ReducerRegistry';
import { TRACK_REMOVED } from '../tracks/actionTypes';

import {
    GUM_PENDING,
    SET_AUDIO_AVAILABLE,
    SET_AUDIO_MUTED,
    SET_AUDIO_UNMUTE_PERMISSIONS,
    SET_CAMERA_FACING_MODE,
    SET_SCREENSHARE_MUTED,
    SET_VIDEO_AVAILABLE,
    SET_VIDEO_MUTED,
    SET_VIDEO_UNMUTE_PERMISSIONS,
    STORE_VIDEO_TRANSFORM,
    TOGGLE_CAMERA_FACING_MODE
} from './actionTypes';
import { CAMERA_FACING_MODE, MEDIA_TYPE, SCREENSHARE_MUTISM_AUTHORITY } from './constants';
import { IGUMPendingState } from './types';

/**
 * Media state object for local audio.
 *
 * @typedef {Object} AudioMediaState
 * @property {boolean} muted=false - Audio muted state.
 */

// FIXME Technically, _AUDIO_INITIAL_MEDIA_STATE is a constant internal to the
// feature base/media and used in multiple files so it should be in
// constants.js. Practically though, AudioMediaState would then be used in
// multiple files as well so I don't know where and how to move it.
/**
 * Initial state for local audio.
 *
 * @type {AudioMediaState}
 */
export const _AUDIO_INITIAL_MEDIA_STATE = {
    available: true,
    gumPending: IGUMPendingState.NONE,
    unmuteBlocked: false,
    muted: false
};

/**
 * Reducer for audio media state.
 *
 * @param {AudioMediaState} state - Media state of local audio.
 * @param {Object} action - Action object.
 * @param {string} action.type - Type of action.
 * @private
 * @returns {AudioMediaState}
 */
function _audio(state: IAudioState = _AUDIO_INITIAL_MEDIA_STATE, action: AnyAction) {
    switch (action.type) {
    case SET_AUDIO_AVAILABLE:
        return {
            ...state,
            available: action.available
        };

    case GUM_PENDING:
        if (action.mediaTypes.includes(MEDIA_TYPE.AUDIO)) {
            return {
                ...state,
                gumPending: action.status
            };
        }

        return state;

    case SET_AUDIO_MUTED:
        return {
            ...state,
            muted: action.muted
        };

    case SET_AUDIO_UNMUTE_PERMISSIONS:
        return {
            ...state,
            unmuteBlocked: action.blocked
        };

    default:
        return state;
    }
}

/**
 * Media state object for local screenshare.
 *
 * @typedef {Object} ScreenshareMediaState
 * @property {boolean} available=true - Screenshare available state.
 * @property {boolean} muted=true - Screenshare muted state.
 * @property {boolean} unmuteBlocked=false - Screenshare unmute blocked state.
 */

/**
 * Initial state for video.
 *
 * @type {ScreenshareMediaState}
 */
export const _SCREENSHARE_INITIAL_MEDIA_STATE = {
    available: true,
    muted: SCREENSHARE_MUTISM_AUTHORITY.USER,
    unmuteBlocked: false
};

/**
 * Reducer for screenshare media state.
 *
 * @param {VideoMediaState} state - Media state of local screenshare.
 * @param {Object} action - Action object.
 * @param {string} action.type - Type of action.
 * @private
 * @returns {ScreenshareMediaState}
 */
function _screenshare(state: IScreenshareState = _SCREENSHARE_INITIAL_MEDIA_STATE, action: AnyAction) {
    switch (action.type) {
    case SET_SCREENSHARE_MUTED:
        return {
            ...state,
            muted: action.muted
        };

    case SET_VIDEO_UNMUTE_PERMISSIONS:
        return {
            ...state,
            unmuteBlocked: action.blocked
        };

    default:
        return state;
    }
}

/**
 * Media state object for local video.
 *
 * @typedef {Object} VideoMediaState
 * @property {CAMERA_FACING_MODE} facingMode='user' - Camera facing mode.
 * @property {boolean} muted=false - Video muted state.
 */

// FIXME Technically, _VIDEO_INITIAL_MEDIA_STATE is a constant internal to the
// feature base/media and used in multiple files so it should be in
// constants.js. Practically though, VideoMediaState would then be used in
// multiple files as well so I don't know where and how to move it.
/**
 * Initial state for video.
 *
 * @type {VideoMediaState}
 */
export const _VIDEO_INITIAL_MEDIA_STATE = {
    available: true,
    gumPending: IGUMPendingState.NONE,
    unmuteBlocked: false,
    facingMode: CAMERA_FACING_MODE.USER,
    muted: 0,

    /**
     * The video {@link Transform}s applied to {@code MediaStream}s by
     * {@code id} i.e. "pinch to zoom".
     */
    transforms: {}
};

/**
 * Reducer for camera media state.
 *
 * @param {VideoMediaState} state - Media state of local video.
 * @param {Object} action - Action object.
 * @param {string} action.type - Type of action.
 * @private
 * @returns {VideoMediaState}
 */
function _video(state: IVideoState = _VIDEO_INITIAL_MEDIA_STATE, action: any) {
    switch (action.type) {
    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:
        return _clearAllVideoTransforms(state);

    case GUM_PENDING:
        if (action.mediaTypes.includes(MEDIA_TYPE.VIDEO)) {
            return {
                ...state,
                gumPending: action.status
            };
        }

        return state;

    case SET_CAMERA_FACING_MODE:
        return {
            ...state,
            facingMode: action.cameraFacingMode
        };

    case SET_VIDEO_AVAILABLE:
        return {
            ...state,
            available: action.available
        };

    case SET_VIDEO_MUTED:
        return {
            ...state,
            muted: action.muted
        };

    case SET_VIDEO_UNMUTE_PERMISSIONS:
        return {
            ...state,
            unmuteBlocked: action.blocked
        };

    case STORE_VIDEO_TRANSFORM:
        return _storeVideoTransform(state, action);

    case TOGGLE_CAMERA_FACING_MODE: {
        let cameraFacingMode = state.facingMode;

        cameraFacingMode
            = cameraFacingMode === CAMERA_FACING_MODE.USER
                ? CAMERA_FACING_MODE.ENVIRONMENT
                : CAMERA_FACING_MODE.USER;

        return {
            ...state,
            facingMode: cameraFacingMode
        };
    }

    case TRACK_REMOVED:
        return _trackRemoved(state, action);

    default:
        return state;
    }
}

interface IAudioState {
    available: boolean;
    gumPending: IGUMPendingState;
    muted: boolean;
    unmuteBlocked: boolean;
}

interface IScreenshareState {
    available: boolean;
    muted: number;
    unmuteBlocked: boolean;
}

interface IVideoState {
    available: boolean;
    facingMode: string;
    gumPending: IGUMPendingState;
    muted: number;
    transforms: Object;
    unmuteBlocked: boolean;
}

export interface IMediaState {
    audio: IAudioState;
    screenshare: IScreenshareState;
    video: IVideoState;
}

/**
 * Listen for various actions related to media devices.
 *
 * @param {Object} state - State of media devices.
 * @param {Object} action - Action object.
 * @param {string} action.type - Type of action.
 * @param {Object} action.media - Information about media devices to be
 * modified.
 * @returns {Object}
 */
ReducerRegistry.register<IMediaState>('features/base/media', combineReducers({
    audio: _audio,
    screenshare: _screenshare,
    video: _video
}));

/**
 * Removes all stored video {@link Transform}s.
 *
 * @param {Object} state - The {@code video} state of the feature base/media.
 * @private
 * @returns {Object}
 */
function _clearAllVideoTransforms(state: IVideoState) {
    return {
        ...state,
        transforms: _VIDEO_INITIAL_MEDIA_STATE.transforms
    };
}

/**
 * Stores the last applied transform to a stream.
 *
 * @param {Object} state - The {@code video} state of the feature base/media.
 * @param {Object} action - The redux action {@link STORE_VIDEO_TRANSFORM}.
 * @private
 * @returns {Object}
 */
function _storeVideoTransform(state: IVideoState, { streamId, transform }: { streamId: string; transform: string; }) {
    return {
        ...state,
        transforms: {
            ...state.transforms,
            [streamId]: transform
        }
    };
}

/**
 * Removes the stored video {@link Transform} associated with a
 * {@code MediaStream} when its respective track is removed.
 *
 * @param {Object} state - The {@code video} state of the feature base/media.
 * @param {Object} action - The redux action {@link TRACK_REMOVED}.
 * @private
 * @returns {Object}
 */
function _trackRemoved(state: IVideoState, { track: { jitsiTrack } }: { track: { jitsiTrack: any; }; }) {
    if (jitsiTrack) {
        const streamId = jitsiTrack.getStreamId();

        if (streamId && streamId in state.transforms) {
            const nextTransforms: any = {
                ...state.transforms
            };

            delete nextTransforms[streamId];

            return {
                ...state,
                transforms: nextTransforms
            };
        }
    }

    return state;
}
