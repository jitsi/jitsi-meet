import { createRestrictWhiteboardEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IStore } from '../app/types';

import { resetWhiteboard, setWhiteboardOpen } from './actions.any';
import { getCollabDetails, isWhiteboardAllowed, isWhiteboardOpen, isWhiteboardVisible } from './functions';
import { WhiteboardStatus } from './types';

export * from './actions.any';

/**
 * API to toggle the whiteboard.
 *
 * @param {boolean} [open] - If provided, explicitly sets the whiteboard open state
 * instead of toggling based on visibility.
 * @returns {Function}
 */
export function toggleWhiteboard(open?: boolean) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const isAllowed = isWhiteboardAllowed(state);
        const isOpen = isWhiteboardOpen(state);

        if (isAllowed) {
            if (typeof open === 'boolean') {
                if (open !== isOpen) {
                    dispatch(setWhiteboardOpen(open, true));
                }
            } else if (isOpen && !isWhiteboardVisible(state)) {
                dispatch(setWhiteboardOpen(true, true));
            } else if (isOpen && isWhiteboardVisible(state)) {
                dispatch(setWhiteboardOpen(false, true));
            } else if (!isOpen) {
                dispatch(setWhiteboardOpen(true, true));
            }
        } else if (isOpen || getCollabDetails(state)) {
            const shouldShow = open ?? !isOpen;

            if (shouldShow !== isOpen) {
                dispatch(setWhiteboardOpen(shouldShow));
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
