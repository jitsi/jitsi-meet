// @flow

import { TOGGLE_TOOLBOX_VISIBLE } from './actionTypes';

export * from './actions.any';

/**
 * Action to toggle the toolbox visibility.
 *
 * @returns {{
 *     type: TOGGLE_TOOLBOX_VISIBLE
 * }}
 */
export function toggleToolboxVisible() {
    return {
        type: TOGGLE_TOOLBOX_VISIBLE
    };
}
