// @flow

import { MiddlewareRegistry } from '../../base/redux';

import { sendEvent } from '../external-api';

import { INCOMING_CALL_ANSWERED, INCOMING_CALL_DECLINED } from './actionTypes';

/**
 * Middleware that captures redux actions and uses the ExternalAPI module to
 * turn them into native events so the app knows about them.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case INCOMING_CALL_ANSWERED:
    case INCOMING_CALL_DECLINED:
        sendEvent(store, action.type, /* data */ {});
        break;
    }

    return result;
});
