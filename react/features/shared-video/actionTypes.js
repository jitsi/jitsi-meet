// @flow

/**
 * The type of the action which signals to update the current known state of the
 * shared video.
 *
 * {
 *     type: SET_SHARED_VIDEO_STATUS,
 *     status: string
 * }
 */
export const SET_SHARED_VIDEO_STATUS = 'SET_SHARED_VIDEO_STATUS';

/**
 * The type of the action which signals to start the flow for starting or
 * stopping a shared video.
 *
 * {
 *     type: TOGGLE_SHARED_VIDEO
 * }
 */
export const TOGGLE_SHARED_VIDEO = 'TOGGLE_SHARED_VIDEO';
