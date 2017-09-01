/**
 * The type of the action which sets whether or not the filmstrip is being
 * hovered with the cursor.
 *
 * {
 *     type: SET_FILMSTRIP_HOVERED,
 *     hovered: boolean
 * }
 */
export const SET_FILMSTRIP_HOVERED = Symbol('SET_FILMSTRIP_HOVERED');

/**
 * The type of action sets the visibility of the entire filmstrip.
 *
 * {
 *     type: SET_FILMSTRIP_VISIBILITY,
 *     visible: boolean
 * }
 */
export const SET_FILMSTRIP_VISIBILITY = Symbol('SET_FILMSTRIP_VISIBILITY');
