/**
 * The type of (Redux) action which configures if the welcome page should be
 * disabled or not.
 *
 * {
 *     type: APP_SET_WELCOME_PAGE_DISABLED,
 *     app: App,
 *     disabled: boolean
 * }
 */
export const APP_SET_WELCOME_PAGE_DISABLED
    = Symbol('APP_SET_WELCOME_PAGE_DISABLED');

/**
 * The type of (Redux) action which signals that a specific App will mount (in
 * React terms).
 *
 * {
 *     type: APP_WILL_MOUNT,
 *     app: App
 * }
 */
export const APP_WILL_MOUNT = Symbol('APP_WILL_MOUNT');

/**
 * The type of (Redux) action which signals that a specific App will unmount (in
 * React terms).
 *
 * {
 *     type: APP_WILL_UNMOUNT,
 *     app: App
 * }
 */
export const APP_WILL_UNMOUNT = Symbol('APP_WILL_UNMOUNT');
