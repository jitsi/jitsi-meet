import { SET_ROOM } from '../base/conference';
import { SET_CONFIG } from '../base/config';
import { MiddlewareRegistry } from '../base/redux';

import { initAnalytics, resetAnalytics } from './functions';

/**
 * Middleware which intercepts config actions to handle evaluating analytics
 * config based on the config stored in the store.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_CONFIG: {
        if (navigator.product === 'ReactNative') {
            // Reseting the analytics is currently not needed for web because
            // the user will be redirected to another page and new instance of
            // Analytics will be created and initialized.
            resetAnalytics();
        }

        break;
    }
    case SET_ROOM: {
        const result = next(action);

        initAnalytics(store);

        return result;
    }
    }

    return next(action);
});
