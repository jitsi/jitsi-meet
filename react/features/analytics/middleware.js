import { MiddlewareRegistry } from '../base/redux';
import { LIB_DID_INIT } from '../base/lib-jitsi-meet';

import { initAnalytics } from './functions';

/**
 * Middleware which intercepts config actions to handle evaluating analytics
 * config based on the config stored in the store.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case LIB_DID_INIT: {
        initAnalytics(store);
        break;
    }
    }

    return next(action);
});
