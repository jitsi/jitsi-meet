import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import statsEmitter from './statsEmitter';

/**
 * Implements the middleware of the feature connection-indicator.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_JOINED: {
        statsEmitter.startListeningForStats(action.conference);
        break;
    }
    }

    return next(action);
});

