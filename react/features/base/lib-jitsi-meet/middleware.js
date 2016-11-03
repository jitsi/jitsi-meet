import { PARTICIPANT_LEFT } from '../participants';
import { MiddlewareRegistry } from '../redux';

import {
    disposeLib,
    initLib
} from './actions';
import { SET_CONFIG } from './actionTypes';

/**
 * Middleware that captures PARTICIPANT_LEFT action for a local participant
 * (which signalizes that we finally left the app) and disposes lib-jitsi-meet.
 * Also captures SET_CONFIG action and disposes previous instance (if any) of
 * lib-jitsi-meet, and initializes a new one with new config.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case PARTICIPANT_LEFT:
        action.participant.local && store.dispatch(disposeLib());
        break;

    case SET_CONFIG: {
        const { dispatch, getState } = store;
        const initialized
            = getState()['features/base/lib-jitsi-meet'].initialized;

        // XXX If we already have config, that means new config is coming, which
        // means that we should dispose instance of lib initialized with
        // previous config first.
        // TODO Currently 'disposeLib' actually does not dispose lib-jitsi-meet.
        // This functionality should be implemented.
        const promise
            = initialized ? dispatch(disposeLib()) : Promise.resolve();

        promise.then(dispatch(initLib()));

        break;
    }
    }

    return next(action);
});
