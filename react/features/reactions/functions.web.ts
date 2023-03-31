import { IReduxState } from '../app/types';

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
