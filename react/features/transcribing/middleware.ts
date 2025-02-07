import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { showErrorNotification } from '../notifications/actions';

import { TRANSCRIBER_LEFT } from './actionTypes';
import './subscriber';

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
            }));
        }
        break;
    }

    return next(action);
});
