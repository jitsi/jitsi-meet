// @flow

import { MiddlewareRegistry } from '../base/redux';

import { OPEN_DESKTOP_APP } from './actionTypes';
import { openDesktopApp } from './functions';

/**
 * Implements the middleware of the deeplinking feature.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case OPEN_DESKTOP_APP:
        openDesktopApp();
        break;
    }

    return next(action);
});
