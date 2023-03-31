import { IReduxState } from '../app/types';
import { showOverflowDrawer } from '../toolbox/functions.web';

export * from './function.any';

/**
 * Returns the visibility state of the gifs menu.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isGifsMenuOpen(state: IReduxState) {
    const overflowDrawer = showOverflowDrawer(state);
    const { overflowMenuVisible } = state['features/toolbox'];
    const { overflowVisible, drawerVisible, menuOpen } = state['features/gifs'];

    if (overflowMenuVisible && !overflowDrawer) {
        return overflowVisible;
    }

    return overflowDrawer ? drawerVisible : menuOpen;
}
