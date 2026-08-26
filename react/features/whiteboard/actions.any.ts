import { IStore } from '../app/types';
import { showWarningNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import {
    RESET_WHITEBOARD,
    SETUP_WHITEBOARD,
    SET_WHITEBOARD_OPEN
} from './actionTypes';
import { IWhiteboardAction } from './reducer';

/**
 * Configures the whiteboard collaboration details.
 *
 * @param {Object} payload - The whiteboard settings.
 * @returns {{
 *     type: SETUP_WHITEBOARD,
 *     collabDetails: { roomId: string, roomKey: string },
 *     collabServerUrl: string
 * }}
 */
export const setupWhiteboard = ({ collabDetails, collabServerUrl }: {
    collabDetails: { roomId: string; roomKey: string; };
    collabServerUrl?: string;
}): IWhiteboardAction => {
    return {
        type: SETUP_WHITEBOARD,
        collabDetails,
        collabServerUrl
    };
};

/**
 * Cleans up the whiteboard collaboration settings.
 * To be used only on native for cleanup in between conferences.
 *
 * @returns {{
 *     type: RESET_WHITEBOARD
 * }}
 */
export const resetWhiteboard = (): IWhiteboardAction => {
    return { type: RESET_WHITEBOARD };
};

/**
 * Sets the whiteboard visibility status.
 *
 * @param {boolean} isOpen - The whiteboard visibility flag.
 * @param {boolean} userInitiated - Whether the action was triggered by a user interaction.
 * @returns {{
 *      type: SET_WHITEBOARD_OPEN,
 *      isOpen,
 *      userInitiated
 * }}
 */
export const setWhiteboardOpen = (isOpen: boolean, userInitiated?: boolean): IWhiteboardAction => {
    return {
        type: SET_WHITEBOARD_OPEN,
        isOpen,
        userInitiated
    };
};

/**
 * Shows a warning notification about the whiteboard user limit.
 *
 * @returns {Function}
 */
export const notifyWhiteboardLimit = () => (dispatch: IStore['dispatch']) => {
    dispatch(showWarningNotification({
        titleKey: 'notify.whiteboardLimitTitle',
        descriptionKey: 'notify.whiteboardLimitDescription'
    }, NOTIFICATION_TIMEOUT_TYPE.LONG));
};
