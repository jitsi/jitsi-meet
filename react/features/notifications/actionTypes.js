/*
 * The type of (redux) action which signals that a specific notification should
 * not be displayed anymore.
 *
 * {
 *     type: HIDE_NOTIFICATION,
 *     uid: string
 * }
 */
export const HIDE_NOTIFICATION = Symbol('HIDE_NOTIFICATION');

/*
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
