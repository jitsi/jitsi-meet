/* @flow */

import { ImageCache } from 'react-native-img-cache';

import { APP_WILL_MOUNT } from '../../app';
import { CONFERENCE_FAILED, CONFERENCE_LEFT } from '../../base/conference';
import { MiddlewareRegistry } from '../../base/redux';

/**
 * Middleware which captures app startup and conference actions in order to
 * clear the image cache.
 *
 * @returns {Function}
 */
MiddlewareRegistry.register(() => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT:
    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:
        ImageCache.get().clear();
        break;
    }

    return next(action);
});
