/* @flow */

import { ImageCache } from 'react-native-img-cache';

import { APP_WILL_MOUNT } from '../../app';
import { CONFERENCE_FAILED, CONFERENCE_LEFT } from '../../base/conference';
import { MiddlewareRegistry } from '../../base/redux';

/**
 * Middleware that captures conference actions and application startup in order
 * cleans up the image cache.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT:
    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:
        ImageCache.get().clear();
        break;

    }

    return next(action);
});
