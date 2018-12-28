/**
 * The type of (redux) action which signals that all the stored notifications
 * need to be cleared.
 *
 * {
 *     type: CLEAR_NOTIFICATIONS
 * }
 */
export const CLEAR_NOTIFICATIONS = Symbol('CLEAR_NOTIFICATIONS');

/**
 * The type of (redux) action which signals that a specific notification should
 * not be displayed anymore.
 *
 * {
 *     type: HIDE_NOTIFICATION,
 *     uid: number
 * }
 */
export const HIDE_NOTIFICATION = Symbol('HIDE_NOTIFICATION');

/**
 * The type of (redux) action which signals that a notification component should
 * be displayed.
 *
 * {
 *     type: SHOW_NOTIFICATION,
 *     component: ReactComponent,
 *     props: Object,
 *     timeout: number,
 *     uid: number
 * }
 */
export const SHOW_NOTIFICATION = Symbol('SHOW_NOTIFICATION');

/**
 * The type of (redux) action which signals that notifications should not
 * display.
 *
 * {
 *     type: SET_NOTIFICATIONS_ENABLED,
 *     enabled: Boolean
 * }
 */
export const SET_NOTIFICATIONS_ENABLED = Symbol('SET_NOTIFICATIONS_ENABLED');
