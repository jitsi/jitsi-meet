import { SET_ROOM } from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';

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
    case SET_ROOM: {
        const result = next(action);

        initAnalytics(store);

        return result;
    }
    }

    return next(action);
});
