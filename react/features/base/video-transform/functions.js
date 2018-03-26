// @flow

import { toState } from '../redux';

import type { Transform } from './constants';

/**
 * Returns a transform object currently stored for a participant's video.
 *
 * @param {Function|Object} stateful - The Redux state object or a function that
 * returns the Redux state.
 * @param {string} participantId - The participant ID.
 * @returns {Transform}
 */
export function getTransformForParticipant(
        stateful: Object | Function,
        participantId: string
): Transform {
    return toState(stateful)['features/base/video-transform'][participantId];
}
