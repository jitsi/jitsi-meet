import { IReduxState } from '../app/types';

export * from './function.any';

/**
 * Returns the visibility state of the gifs menu.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isGifsMenuOpen(state: IReduxState) {
    return state['features/gifs'].menuOpen;
}
