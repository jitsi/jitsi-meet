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
 * The type of the action which signals to reset the current known state of the
 * shared video.
 *
 * {
 *     type: RESET_SHARED_VIDEO_STATUS,
 * }
 */
export const RESET_SHARED_VIDEO_STATUS = 'RESET_SHARED_VIDEO_STATUS';

/**
 * The type of the action which marks that the user had confirmed to play video.
 *
 * {
 *     type: SET_CONFIRM_SHOW_VIDEO
 * }
 */
export const SET_CONFIRM_SHOW_VIDEO = 'SET_CONFIRM_SHOW_VIDEO';

/**
 * The type of the action which sets an array of whitelisted urls.
 *
 * {
 *     type: SET_ALLOWED_URL_DOMAINS
 * }
 */
export const SET_ALLOWED_URL_DOMAINS = 'SET_ALLOWED_URL_DOMAINS';
