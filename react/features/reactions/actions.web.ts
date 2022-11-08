import {
    TOGGLE_REACTIONS_VISIBLE
} from './actionTypes';
import { IReactionsAction } from './reducer';

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
