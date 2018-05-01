// @flow

import { MiddlewareRegistry } from '../base/redux';

import { UPDATE_DIAL_IN_NUMBERS_FAILED } from './actionTypes';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * The middleware of the feature invite common to mobile/react-native and
 * Web/React.
 *
 * @param {Store} store - The redux store.
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
