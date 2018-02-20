// @flow

import { ReducerRegistry } from '../redux';

import {
    APPLY_VIDEO_TRANSFORMATION,
    UPDATE_VIDEO_TRANSFORMATION
} from './actionTypes';
import { DEFAULT_TRANSFORM } from './constants';

const MAX_SCALE = 5;

ReducerRegistry.register(
    'features/base/video-transform',
    (state = {}, action) => {
        switch (action.type) {

        case APPLY_VIDEO_TRANSFORMATION:
            return _applyVideoTransformation(state, action);

        case UPDATE_VIDEO_TRANSFORMATION:
            return _updateVideoTransformation(state, action);
        }

        return state;
    });

/**
 * Applies a new, incremental transformation (zoom, position) to a
 * participant's video.
 *
 * @private
 * @param {Object} state - The redux state.
 * @param {Object} action - The redux action.
 * @returns {Object}
 */
function _applyVideoTransformation(state, action) {
    const { participantId, transform } = action;
    let currentTransform;

    const storedTransform
        = state[participantId];

    if (storedTransform) {
        currentTransform = storedTransform;
    } else {
        currentTransform = DEFAULT_TRANSFORM;
    }

    const newTransform = {
        ...DEFAULT_TRANSFORM,
        ...transform
    };

    let {
        scale,
        translateX,
        translateY
    } = currentTransform;
    const {
        scale: newScale,
        translateX: newTranslateX,
        translateY: newTranslateY
    } = newTransform;

    // Note: we don't limit min scale here yet, as we need to detect a
    // scale down gesture even if the scale is already at MIN_SCALE
    // to let the user return the screen to center with that gesture.
    // Scale is limited to MIN_SCALE right before it gets applied.
    scale = Math.min(
        scale * (newScale || 1), MAX_SCALE
    );

    translateX = Math.round(translateX + ((newTranslateX || 0) / scale));
    translateY = Math.round(translateY + ((newTranslateY || 0) / scale));

    const participantTransform = {};

    participantTransform[participantId] = {
        scale,
        translateX,
        translateY
    };

    return {
        ...state,
        ...participantTransform
    };
}

/**
 * Updates (overwrites) a transformation (zoom, position) of a
 * participant's video.
 *
 * @private
 * @param {Object} state - The redux state.
 * @param {Object} action - The redux action.
 * @returns {Object}
 */
function _updateVideoTransformation(state, action) {
    const { participantId, transform } = action;
    const oldTransform = state[participantId];
    const participantTransform = {};

    // Merging old values if it's a partial update.
    const newTransform = {
        ...oldTransform,
        ...transform
    };

    participantTransform[participantId] = newTransform;


    return {
        ...state,
        ...participantTransform
    };
}
