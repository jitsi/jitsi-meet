/**
 * The type of (redux) action which indicates that the client window has been resized.
 *
 * {
 *     type: CLIENT_RESIZED
 * }
 */
export const CLIENT_RESIZED = 'CLIENT_RESIZED';

/**
 * The type of (redux) action which indicates that the insets from the SafeAreaProvider have changed.
 *
 * {
 *    type: SAFE_AREA_INSETS_CHANGED,
 *    insets: Object
 * }
 */
 export const SAFE_AREA_INSETS_CHANGED = 'SAFE_AREA_INSETS_CHANGED';

/**
 * The type of (redux) action which sets the aspect ratio of the app's user
 * interface.
 *
 * {
 *     type: SET_ASPECT_RATIO,
 *     aspectRatio: Symbol
 * }
 */
export const SET_ASPECT_RATIO = 'SET_ASPECT_RATIO';

/**
 * The type of redux action which signals that the reduces UI mode was enabled
 * or disabled.
 *
 * {
 *     type: SET_REDUCED_UI,
 *     reducedUI: boolean
 * }
 *
 * @public
 */
export const SET_REDUCED_UI = 'SET_REDUCED_UI';

/**
 * The type of (redux) action which tells whether a local or remote participant
 * context menu is open.
 *
 * {
 *     type: SET_CONTEXT_MENU_OPEN,
 *     showConnectionInfo: boolean
 * }
 */
export const SET_CONTEXT_MENU_OPEN = 'SET_CONTEXT_MENU_OPEN';

/**
 * The type of redux action which signals whether we are in narrow layout.
 *
 * {
 *     type: SET_NARROW_LAYOUT,
 *     isNarrow: boolean
 * }
 *
 * @public
 */
export const SET_NARROW_LAYOUT = 'SET_NARROW_LAYOUT';

