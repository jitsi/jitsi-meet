// @flow

import { NativeModules } from 'react-native';

import { MiddlewareRegistry } from '../../base/redux';

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
    switch (action.type) {
    case INCOMING_CALL_ANSWERED:
        _sendEvent(store, 'INCOMING_CALL_ANSWERED', /* data */ {});
        break;
    case INCOMING_CALL_DECLINED:
        _sendEvent(store, 'INCOMING_CALL_DECLINED', /* data */ {});
        break;
    }

    return next(action);
});

/**
 * Sends a specific event to the native counterpart of the External API. Native
 * apps may listen to such events via the mechanisms provided by the (native)
 * mobile Jitsi Meet SDK.
 *
 * @param {Object} store - The redux store.
 * @param {string} name - The name of the event to send.
 * @param {Object} data - The details/specifics of the event to send determined
 * by/associated with the specified {@code name}.
 * @private
 * @returns {void}
 */
function _sendEvent(
        { getState }: { getState: Function },
        name: string,
        data: Object) {
    const { app } = getState()['features/app'];

    if (app) {
        const { externalAPIScope } = app.props;

        if (externalAPIScope) {
            NativeModules
            .IncomingCallExternalAPI.sendEvent(name, data, externalAPIScope);
        }
    }
}
