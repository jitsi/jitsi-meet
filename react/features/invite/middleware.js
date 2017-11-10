import { CONFERENCE_JOINED } from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';

import { setInfoDialogVisibility } from './actions';
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
    case CONFERENCE_JOINED:
        // we do not want to show call info in iAmRecorder mode
        if (store.getState()['features/base/config'].iAmRecorder) {
            return result;
        }
        store.dispatch(setInfoDialogVisibility(true, true));
        break;

    case UPDATE_DIAL_IN_NUMBERS_FAILED:
        logger.error(
            'Error encountered while fetching dial-in numbers:',
            action.error);
        break;
    }

    return result;
});
