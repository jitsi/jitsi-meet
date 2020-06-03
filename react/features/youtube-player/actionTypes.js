/**
 * The type of the action which signals to update the current known state of the
 * shared YouTube video.
 *
 * {
 *     type: SET_SHARED_VIDEO_STATUS,
 *     status: string
 * }
 */
export const SET_SHARED_VIDEO_STATUS = 'SET_SHARED_VIDEO_STATUS';

/**
 * The type of the action which signals to update the current known state of the
 * shared YouTube video owner id.
 *
 * {
 *     type: SET_SHARED_VIDEO_OWNER,
 *     owner: string
 * }
 */
export const SET_SHARED_VIDEO_OWNER = 'SET_SHARED_VIDEO_OWNER';

/**
 * The type of the action which signals to start the flow for starting or
 * stopping a shared YouTube video.
 *
 * {
 *     type: TOGGLE_SHARED_VIDEO
 * }
 */
export const TOGGLE_SHARED_VIDEO = 'TOGGLE_SHARED_VIDEO';

/**
 * The type of the (redux) action which shows/hides the Toolbox.
 *
 * {
 *     type: SET_TOOLBOX_VISIBLE,
 *     visible: boolean
 * }
 */
export const SET_TOOLBOX_VISIBLE = 'SET_TOOLBOX_VISIBLE';
