import {
    SHOW_SOUNDS_NOTIFICATION,
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

/**
 * Displays the disable sounds notification.
 *
 * @returns {void}
 */
export function displayReactionSoundsNotification(): IReactionsAction {
    return {
        type: SHOW_SOUNDS_NOTIFICATION
    };
}
