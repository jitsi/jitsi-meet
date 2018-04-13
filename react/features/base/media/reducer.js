import { combineReducers } from 'redux';

import { CONFERENCE_FAILED, CONFERENCE_LEFT } from '../conference';
import { ReducerRegistry } from '../redux';
import { TRACK_REMOVED } from '../tracks';

import {
    SET_AUDIO_AVAILABLE,
    SET_AUDIO_MUTED,
    SET_CAMERA_FACING_MODE,
    SET_VIDEO_AVAILABLE,
    SET_VIDEO_MUTED,
    STORE_VIDEO_TRANSFORM,
    TOGGLE_CAMERA_FACING_MODE
} from './actionTypes';
import { CAMERA_FACING_MODE } from './constants';

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
function _audio(state = _AUDIO_INITIAL_MEDIA_STATE, action) {
    switch (action.type) {
    case SET_AUDIO_AVAILABLE:
        return {
            ...state,
            available: action.available
        };

    case SET_AUDIO_MUTED:
        return {
            ...state,
            muted: action.muted
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
function _video(state = _VIDEO_INITIAL_MEDIA_STATE, action) {
    switch (action.type) {
    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:
        return _clearAllVideoTransforms(state);

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
ReducerRegistry.register('features/base/media', combineReducers({
    audio: _audio,
    video: _video
}));

/**
 * Removes all stored video {@link Transform}s.
 *
 * @param {Object} state - The {@code video} state of the feature base/media.
 * @private
 * @returns {Object}
 */
function _clearAllVideoTransforms(state) {
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
function _storeVideoTransform(state, { streamId, transform }) {
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
function _trackRemoved(state, { track: { jitsiTrack } }) {
    if (jitsiTrack) {
        const streamId = jitsiTrack.getStreamId();

        if (streamId && streamId in state.transforms) {
            const nextTransforms = {
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
