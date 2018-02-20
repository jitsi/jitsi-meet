// @flow

import {
    APPLY_VIDEO_TRANSFORMATION,
    UPDATE_VIDEO_TRANSFORMATION
} from './actionTypes';
import type { Transform } from './constants';

/**
 * Action to signal the application of the transformation (zoom, position)
 * data of the participant's video incementally.
 *
 * @param {string} participantId - The participant id of the video.
 * @param {Transform} transform - The new transformation values.
 * @returns {{
 *     type: APPLY_VIDEO_TRANSFORMATION,
 *     participantId: string,
 *     transform: Transform
 * }}
 */
export function applyVideoTransformation(
        participantId: string,
        transform: Transform
) {
    return {
        type: APPLY_VIDEO_TRANSFORMATION,
        participantId,
        transform
    };
}

/**
 * Action to signal the update (ovrwrite) of the transformation (zoom, position)
 * data of the participant's video.
 *
 * @param {string} participantId - The participant id of the video.
 * @param {Transform} transform - The new transformation values.
 * @returns {{
 *     type: UPDATE_VIDEO_TRANSFORMATION,
 *     participantId: string,
 *     transform: Transform
 * }}
 */
export function updateVideoTransformation(
        participantId: string,
        transform: Transform
) {
    return {
        type: UPDATE_VIDEO_TRANSFORMATION,
        participantId,
        transform
    };
}
