import { CONFERENCE_FAILED, CONFERENCE_LEFT } from '../base/conference/actionTypes';
import { CONNECTION_DISCONNECTED } from '../base/connection/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { closeSecondaryWindow, getSecondaryWindow } from './actions.web';
import logger from './logger';

/**
 * Middleware for the multi-screen feature.
 *
 * Handles automatic cleanup of the secondary window whenever the user leaves
 * the conference — by leaving, on failure, or on disconnect — preventing stale
 * orphaned popup windows.
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_LEFT:
    case CONFERENCE_FAILED:
    case CONNECTION_DISCONNECTED: {
        const secondaryWindow = getSecondaryWindow();

        if (secondaryWindow && !secondaryWindow.closed) {
            logger.info(`${action.type} — auto-closing secondary window`);
            store.dispatch(closeSecondaryWindow());
        }
        break;
    }
    }

    return result;
});
