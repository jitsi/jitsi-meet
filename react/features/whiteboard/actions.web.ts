import { createRestrictWhiteboardEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IStore } from '../app/types';
import { getParticipantCount } from '../base/participants/functions';
import { showErrorNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

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
            let shouldOpen = false;

            if (typeof open === 'boolean') {
                if (open !== isOpen) {
                    shouldOpen = open;
                    dispatch(setWhiteboardOpen(open));
                }
            } else if (isOpen && !isWhiteboardVisible(state)) {
                shouldOpen = true;
                dispatch(setWhiteboardOpen(true));
            } else if (isOpen && isWhiteboardVisible(state)) {
                dispatch(setWhiteboardOpen(false));
            } else if (!isOpen) {
                shouldOpen = true;
                dispatch(setWhiteboardOpen(true));
            }

            // If we tried to open but the middleware blocked it, show an error.
            // Skip when alone or when there are no collab details yet — the
            // first open is async and the middleware blocks the action until
            // the collab setup completes.
            if (shouldOpen && !isWhiteboardOpen(getState())
                && getParticipantCount(getState()) >= 2
                && getCollabDetails(getState())) {
                dispatch(showErrorNotification({
                    titleKey: 'info.noWhiteboard'
                }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
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
