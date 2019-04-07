/**
 * The type of Redux action which closes a dialog
 *
 * {
 *     type: HIDE_DIALOG
 * }
 */
export const HIDE_DIALOG = 'HIDE_DIALOG';

/**
 * The type of Redux action which begins a request to open a dialog.
 *
 * {
 *     type: OPEN_DIALOG,
 *     component: React.Component,
 *     props: PropTypes
 * }
 *
 */
export const OPEN_DIALOG = 'OPEN_DIALOG';
