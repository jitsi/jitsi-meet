import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../app';
import { MiddlewareRegistry } from '../../base/redux';

import { startNetInterception, stopNetInterception } from './functions';

/**
 * Middleware which captures app startup and conference actions in order to
 * clear the image cache.
 *
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_WILL_MOUNT:
        startNetInterception(store);
        break;
    case APP_WILL_UNMOUNT:
        stopNetInterception(store);
        break;
    }

    return result;
});
