import { Symbol } from '../base/react';

/**
 * The type of the actions which signals that a specific App will mount (in the
 * terms of React).
 *
 * {
 *     type: APP_WILL_MOUNT,
 *     app: App
 * }
 */
export const APP_WILL_MOUNT = Symbol('APP_WILL_MOUNT');

/**
 * The type of the actions which signals that a specific App will unmount (in
 * the terms of React).
 *
 * {
 *     type: APP_WILL_UNMOUNT,
 *     app: App
 * }
 */
export const APP_WILL_UNMOUNT = Symbol('APP_WILL_UNMOUNT');

/**
 * The type of this action sets the platform of user agent
 * in order to decide to show the landing or not.
 *
 * {
 *      type: APP_SET_PLATFORM,
 *      platform: String
 * }
 */
export const APP_SET_PLATFORM = Symbol('APP_SET_PLATFORM');
