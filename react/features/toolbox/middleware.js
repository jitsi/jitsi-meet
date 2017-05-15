/* @flow */

import { MiddlewareRegistry } from '../base/redux';

import {
    CLEAR_TOOLBOX_TIMEOUT,
    SET_TOOLBOX_TIMEOUT
} from './actionTypes';

/**
 * Middleware which intercepts Toolbox actions to handle changes to the
 * visibility timeout of the Toolbox.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CLEAR_TOOLBOX_TIMEOUT: {
        const { timeoutID } = store.getState()['features/toolbox'];

        clearTimeout(timeoutID);
        break;
    }

    case SET_TOOLBOX_TIMEOUT: {
        const { timeoutID } = store.getState()['features/toolbox'];
        const { handler, timeoutMS } = action;

        clearTimeout(timeoutID);
        const newTimeoutId = setTimeout(handler, timeoutMS);

        action.timeoutID = newTimeoutId;
        break;
    }
    }

    return next(action);
});
