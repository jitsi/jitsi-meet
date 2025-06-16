import { createRestrictWhiteboardEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IStore } from '../app/types';

import { resetWhiteboard, setWhiteboardOpen } from './actions.any';
import { isWhiteboardAllowed, isWhiteboardOpen, isWhiteboardVisible } from './functions';
import { WhiteboardStatus } from './types';

export * from './actions.any';

/**
 * API to toggle the whiteboard.
 *
 * @returns {Function}
 */
export function toggleWhiteboard() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const isAllowed = isWhiteboardAllowed(state);
        const isOpen = isWhiteboardOpen(state);

        if (isAllowed) {
            if (isOpen && !isWhiteboardVisible(state)) {
                dispatch(setWhiteboardOpen(true));
            } else if (isOpen && isWhiteboardVisible(state)) {
                dispatch(setWhiteboardOpen(false));
            } else if (!isOpen) {
                dispatch(setWhiteboardOpen(true));
            }
        } else if (typeof APP !== 'undefined') {
            APP.API.notifyWhiteboardStatusChanged(WhiteboardStatus.FORBIDDEN);
        }
    };
}

/**
 * Restricts the whiteboard usage.
 *
 * @param {boolean} shouldCloseWhiteboard - Whether to dismiss the whiteboard.
 * @returns {Function}
 */
export const restrictWhiteboard = (shouldCloseWhiteboard = true) => (dispatch: IStore['dispatch']) => {
    if (shouldCloseWhiteboard) {
        dispatch(setWhiteboardOpen(false));
    }
    dispatch(resetWhiteboard());
    sendAnalytics(createRestrictWhiteboardEvent());
};
