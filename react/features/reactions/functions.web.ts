import { IReduxState } from '../app/types';

import { isReactionsEnabled } from './functions.any';

export * from './functions.any';

/**
 * Returns the visibility state of the reactions menu.
 *
 * @param {Object} state - The state of the application.
 * @returns {boolean}
 */
export function getReactionsMenuVisibility(state: IReduxState): boolean {
    return state['features/reactions'].visible;
}

/**
 * Whether or not the reactions button is enabled.
 *
 * @param {Object} state - The Redux state object.
 * @returns {boolean}
 */
export function isReactionsButtonEnabled(state: IReduxState) {
    const { toolbarButtons } = state['features/toolbox'];

    return Boolean(toolbarButtons?.includes('reactions')) && isReactionsEnabled(state);
}
