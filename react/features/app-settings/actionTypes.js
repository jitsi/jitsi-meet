/**
 * The type of (redux) action which signals the request
 * to hide the app settings modal.
 *
 * {
 *     type: HIDE_APP_SETTINGS
 * }
 */
export const HIDE_APP_SETTINGS = Symbol('HIDE_APP_SETTINGS');

/**
 * The type of (redux) action which signals the request
 * to show the app settings modal where available.
 *
 * {
 *     type: SHOW_APP_SETTINGS
 * }
 */
export const SHOW_APP_SETTINGS = Symbol('SHOW_APP_SETTINGS');
