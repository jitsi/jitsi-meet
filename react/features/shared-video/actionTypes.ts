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
 * The type of the action which signals to mark that dialog for asking whether to load shared video is currently shown.
 *
 * {
 *     type: SET_DIALOG_IN_PROGRESS
 * }
 */
export const SET_DIALOG_IN_PROGRESS = 'SET_DIALOG_IN_PROGRESS';

/**
 * The type of the action which signals to mark that dialog for asking whether to load shared video is shown.
 *
 * {
 *     type: SET_DIALOG_SHOWN
 * }
 */
export const SET_DIALOG_SHOWN = 'SET_DIALOG_SHOWN';


/**
 * The type of the action which signals to disable or enable the shared video
 * button.
 *
 * {
 *     type: SET_DISABLE_BUTTON
 * }
 */
export const SET_DISABLE_BUTTON = 'SET_DISABLE_BUTTON';

/**
 * The type of the action which sets an array of whitelisted urls.
 *
 * {
 *     type: SET_ALLOWED_URL_DOMAINS
 * }
 */
export const SET_ALLOWED_URL_DOMAINS = 'SET_ALLOWED_URL_DOMAINS';
