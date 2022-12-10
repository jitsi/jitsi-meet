import {
    TOGGLE_REACTIONS_VISIBLE
} from './actionTypes';
import { IReactionsAction } from './reducer';

export * from './actions.any';

/**
 * Toggles the visibility of the reactions menu.
 *
 * @returns {void}
 */
export function toggleReactionsMenuVisibility(): IReactionsAction {
    return {
        type: TOGGLE_REACTIONS_VISIBLE
    };
}
