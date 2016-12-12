import { Symbol } from '../base/react';

/**
 * Action to change the participant to be displayed in LargeVideo.
 *
 * {
 *     type: LARGE_VIDEO_PARTICIPANT_CHANGED,
 *     participantId: (string|undefined)
 * }
 */
export const LARGE_VIDEO_PARTICIPANT_CHANGED
    = Symbol('LARGE_VIDEO_PARTICIPANT_CHANGED');
