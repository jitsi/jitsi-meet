import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { showErrorNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { TRANSCRIBER_LEFT } from './actionTypes';

/**
 * Implements the middleware of the feature transcribing.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch }) => next => action => {
    switch (action.type) {
    case TRANSCRIBER_LEFT:
        if (action.abruptly) {
            dispatch(showErrorNotification({
                titleKey: 'transcribing.failed'
            }, NOTIFICATION_TIMEOUT_TYPE.LONG));
        }
        break;
    }

    return next(action);
});
