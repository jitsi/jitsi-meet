/**
 * The type of the action which signals document editing has been enabled.
 *
 * {
 *     type: ETHERDRAW_INITIALIZED
 * }
 */
export const ETHERDRAW_INITIALIZED = Symbol('ETHERDRAW_INITIALIZED');


/**
 * The type of the action which signals document editing has stopped or started.
 *
 * {
 *     type: SET_DRAW_EDITING_STATUS
 * }
 */
export const SET_DRAW_EDITING_STATUS
    = Symbol('SET_DRAW_EDITING_STATUS');

/**
 * The type of the action which signals to start or stop editing a shared
 * document.
 *
 * {
 *     type: TOGGLE_DRAW_EDITING
 * }
 */
export const TOGGLE_DRAW_EDITING = Symbol('TOGGLE_DRAW_EDITING');
