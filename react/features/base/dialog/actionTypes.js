/**
 * The type of Redux action which closes a dialog
 *
 * {
 *     type: HIDE_DIALOG
 * }
 */
export const HIDE_DIALOG = Symbol('HIDE_DIALOG');

/**
 * The type of Redux action which begins a request to open a dialog.
 *
 * {
 *     type: OPEN_DIALOG,
 *     component: React.Component,
 *     props: React.PropTypes.object
 * }
 *
 */
export const OPEN_DIALOG = Symbol('OPEN_DIALOG');
