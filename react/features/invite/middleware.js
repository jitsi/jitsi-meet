import { MiddlewareRegistry } from '../base/redux';

import { UPDATE_DIAL_IN_NUMBERS_FAILED } from './actionTypes';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Middleware that catches actions fetching dial-in numbers.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case UPDATE_DIAL_IN_NUMBERS_FAILED:
        logger.error(
            'Error encountered while fetching dial-in numbers:',
            action.error);
        break;
    }

    return result;
});
