import { combineReducers } from 'redux';

import { ReducerRegistry } from '../redux';

import {
    SET_AUDIO_MUTED,
    SET_CAMERA_FACING_MODE,
    SET_VIDEO_MUTED,
    SET_VIDEO_AVAILABLE,
    TOGGLE_CAMERA_FACING_MODE
} from './actionTypes';
import { CAMERA_FACING_MODE } from './constants';

/**
 * Media state object for local audio.
 *
 * @typedef {Object} AudioMediaState
 * @property {boolean} muted=false - Audio muted state.
 */

/**
 * Initial state for local audio.
 *
 * @type {AudioMediaState}
 */
const AUDIO_INITIAL_MEDIA_STATE = {
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
function _audio(state = AUDIO_INITIAL_MEDIA_STATE, action) {
    switch (action.type) {
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

/**
 * Initial state for video.
 *
 * @type {VideoMediaState}
 */
const VIDEO_INITIAL_MEDIA_STATE = {
    facingMode: CAMERA_FACING_MODE.USER,
    muted: true,
    available: true
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
function _video(state = VIDEO_INITIAL_MEDIA_STATE, action) {
    switch (action.type) {
    case SET_VIDEO_AVAILABLE:
        return {
            ...state,
            available: action.available
        };

    case SET_CAMERA_FACING_MODE:
        return {
            ...state,
            facingMode: action.cameraFacingMode
        };

    case SET_VIDEO_MUTED:
        return {
            ...state,
            muted: action.muted
        };

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
