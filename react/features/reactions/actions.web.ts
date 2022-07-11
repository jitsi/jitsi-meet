import {
    SHOW_SOUNDS_NOTIFICATION,
    TOGGLE_REACTIONS_VISIBLE
} from './actionTypes';
import { ReactionsAction } from './reducer';

/**
 * Toggles the visibility of the reactions menu.
 *
 * @returns {void}
 */
export function toggleReactionsMenuVisibility(): ReactionsAction {
    return {
        type: TOGGLE_REACTIONS_VISIBLE
    };
}

/**
 * Displays the disable sounds notification.
 *
 * @returns {void}
 */
export function displayReactionSoundsNotification(): ReactionsAction {
    return {
        type: SHOW_SOUNDS_NOTIFICATION
    };
}
