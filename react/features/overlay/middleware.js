// @flow

import { MiddlewareRegistry, set } from '../base/redux';

import { CONNECTION_FAILED, getCurrentConnection } from '../base/connection';
import { CONFERENCE_FAILED, getCurrentConference } from '../base/conference';
import { LOAD_CONFIG_ERROR } from '../base/config';
import { setFatalErrorOccurred } from './actions';
import { FATAL_ERROR_OCCURRED } from './actionTypes';

declare var APP: Object;

/**
 * FIXME.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register2(store => next => action => {
    // FIXME this middleware is disabled on web until the reload screen and
    // fatal error handling implementation is unified. Though it doesn't seem to
    // be causing any issues when enabled.
    if (typeof APP !== 'undefined') {
        return next(action);
    }

    switch (action.type) {
    case LOAD_CONFIG_ERROR: {
        // In contrary to connection and conference failure events only
        // the relevant ones are emitted for the config feature.
        return _maybeFatalErrorOccurred(store, next, action);
    }
    case CONNECTION_FAILED: {
        const { connection } = action;
        const currentConnection = getCurrentConnection(store);

        if (connection === currentConnection) {
            return _maybeFatalErrorOccurred(store, next, action);
        }
        break;
    }
    case CONFERENCE_FAILED: {
        const { conference } = action;
        const currentConference = getCurrentConference(store);

        if (conference === currentConference) {
            return _maybeFatalErrorOccurred(store, next, action);
        }
        break;
    }
    case FATAL_ERROR_OCCURRED: {
        const state = store.getState();

        // Reemit the original action which caused the reload screen to appear
        // with recoverable flag set to 'false'.
        if (!action.fatalErrorOccurred) {
            const { fatalErrorCause } = state['features/overlay'];

            if (fatalErrorCause) {
                // FIXME: When a real JS Error instance is copied it will loose
                // part of the state (a message ?).
                const toDispatch
                    = set(fatalErrorCause,
                        'error',
                        set(fatalErrorCause.error, 'recoverable', false));

                toDispatch.error.recoverable = false;

                store.dispatch(toDispatch);
            }
        }
    }
    }

    return next(action);
});

/**
 * FIXME.
 *
 * @param {Store} store - The redux store.
 * @param {Dispatch} next - The redux {@code dispatch} function.
 * @param {Action} action - The redux action.
 * @private
 * @returns {Object} The new state.
 */
function _maybeFatalErrorOccurred({ dispatch }, next, action) {
    const { error } = action;

    if (typeof error.recoverable === 'undefined') {
        error.recoverable = true;

        // Error must be reduced before the "fatal error flag is set" so that
        // the reload dialog have them available in the state.
        const result = next(action);

        dispatch(setFatalErrorOccurred(true, action));

        return result;
    }

    return next(action);
}
