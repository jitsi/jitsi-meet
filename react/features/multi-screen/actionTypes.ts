/**
 * The type of (redux) action which opens or updates a second-screen window with
 * a given source descriptor.
 *
 * {
 *     type: SET_SECOND_SCREEN,
 *     id: string,
 *     source: ISecondScreenSource,
 *     screenId?: number
 * }
 */
export const SET_SECOND_SCREEN = 'SET_SECOND_SCREEN';

/**
 * The type of (redux) action which attaches the live window handle (the
 * {@code Window}, its {@code <video>} and tracks) to a second-screen entry,
 * once the middleware has opened the window.
 *
 * {
 *     type: SET_SECOND_SCREEN_WINDOW,
 *     id: string,
 *     handle: unknown
 * }
 */
export const SET_SECOND_SCREEN_WINDOW = 'SET_SECOND_SCREEN_WINDOW';

/**
 * The type of (redux) action which closes a single second-screen window.
 *
 * {
 *     type: REMOVE_SECOND_SCREEN,
 *     id: string
 * }
 */
export const REMOVE_SECOND_SCREEN = 'REMOVE_SECOND_SCREEN';

/**
 * The type of (redux) action which closes all second-screen windows (e.g. when
 * the conference ends).
 *
 * {
 *     type: RESET_SECOND_SCREENS
 * }
 */
export const RESET_SECOND_SCREENS = 'RESET_SECOND_SCREENS';
