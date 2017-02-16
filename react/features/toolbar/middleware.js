/* @flow */

import { MiddlewareRegistry } from '../base/redux';

import {
    CLEAR_TOOLBAR_TIMEOUT,
    SET_TOOLBAR_TIMEOUT
} from './actionTypes';

/**
 * Middleware that captures toolbar actions and handle changes in toolbar
 * timeout.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CLEAR_TOOLBAR_TIMEOUT: {
        const { timeoutId } = store.getState()['features/toolbar'];

        clearTimeout(timeoutId);
        break;
    }

    case SET_TOOLBAR_TIMEOUT: {
        const { timeoutId } = store.getState()['features/toolbar'];
        const { handler, toolbarTimeout } = action;

        clearTimeout(timeoutId);
        const newTimeoutId = setTimeout(handler, toolbarTimeout);

        action.timeoutId = newTimeoutId;
        break;
    }
    }

    return next(action);
});
