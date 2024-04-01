import { createRestrictWhiteboardEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IStore } from '../app/types';
import {
    navigate
} from '../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../mobile/navigation/routes';


import { resetWhiteboard } from './actions.any';

export * from './actions.any';

/**
 * Restricts the whiteboard usage.
 *
 * @param {boolean} shouldCloseWhiteboard - Whether to dismiss the whiteboard.
 * @returns {Function}
 */
export const restrictWhiteboard = (shouldCloseWhiteboard = true) => (dispatch: IStore['dispatch']) => {
    if (shouldCloseWhiteboard) {
        navigate(screen.conference.root);
    }
    dispatch(resetWhiteboard());
    sendAnalytics(createRestrictWhiteboardEvent());
};
