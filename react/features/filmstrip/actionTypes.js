/**
 * The type of (redux) action which sets whether or not the filmstrip is being
 * hovered with the cursor.
 *
 * {
 *     type: SET_FILMSTRIP_HOVERED,
 *     hovered: boolean
 * }
 */
export const SET_FILMSTRIP_HOVERED = Symbol('SET_FILMSTRIP_HOVERED');

/**
 * The type of (redux) action which sets the visibility of the filmstrip.
 *
 * {
 *     type: SET_FILMSTRIP_VISIBLE,
 *     visible: boolean
 * }
 */
export const SET_FILMSTRIP_VISIBLE = Symbol('SET_FILMSTRIP_VISIBLE');
