export * from './actions.any';

/**
 * Shows the toolbox for specified timeout.
 *
 * @param {number} _timeout - Timeout for showing the toolbox.
 * @returns {Function}
 */
export function showToolbox(_timeout?: number): any {
    return {};
}

/**
 * Shows/hides the overflow menu.
 *
 * @param {boolean} _visible - True to show it or false to hide it.
 * @returns {{
 *     type: SET_OVERFLOW_MENU_VISIBLE,
 *     visible: boolean
 * }}
 */
export function setOverflowMenuVisible(_visible: boolean): any {
    return {};
}
