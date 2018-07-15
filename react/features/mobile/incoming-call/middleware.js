// @flow

import { MiddlewareRegistry } from '../../base/redux';
import { getSymbolDescription } from '../../base/util';

import { sendEvent } from '../external-api';

import {
    INCOMING_CALL_ANSWERED,
    INCOMING_CALL_DECLINED
} from './actionTypes';

/**
 * Middleware that captures Redux actions and uses the IncomingCallExternalAPI
 * module to turn them into native events so the application knows about them.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case INCOMING_CALL_ANSWERED:
    case INCOMING_CALL_DECLINED:
        sendEvent(store, getSymbolDescription(action.type), /* data */ {});
        break;
    }

    return result;
});
