/**
 * The type of the action which signals to close the side panel.
 *
 * {
 *     type: CLOSE_PANEL,
 * }
 */
export const CLOSE_PANEL = Symbol('CLOSE_PANEL');

/**
 * The type of the action which to set the name of the current panel being
 * displayed in the side panel.
 *
 * {
 *     type: SET_VISIBLE_PANEL,
 *     current: string|null
 * }
 */
export const SET_VISIBLE_PANEL = Symbol('SET_VISIBLE_PANEL');

/**
 * The type of the action which signals to toggle the display of chat in the
 * side panel.
 *
 * {
 *     type: TOGGLE_CHAT
 * }
 */
export const TOGGLE_CHAT = Symbol('TOGGLE_CHAT');
