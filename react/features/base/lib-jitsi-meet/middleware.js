/* @flow */

import { SET_CONFIG } from '../config';
import { setLoggingConfig } from '../logging';
import { SET_NETWORK_INFO } from '../net-info';
import { PARTICIPANT_LEFT } from '../participants';
import { MiddlewareRegistry } from '../redux';

import JitsiMeetJS from './_';
import { LIB_WILL_INIT } from './actionTypes';
import { disposeLib, initLib } from './actions';

declare var APP: Object;

/**
 * Middleware that captures PARTICIPANT_LEFT action for a local participant
 * (which signalizes that we finally left the app) and disposes lib-jitsi-meet.
 * Also captures SET_CONFIG action and disposes previous instance (if any) of
 * lib-jitsi-meet, and initializes a new one with new config.
 *
 * @param {Store} store - Redux store.
 * @private
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case LIB_WILL_INIT:
        // Moved from conference.js init method. It appears the error handlers
        // are not used for mobile.
        if (typeof APP !== 'undefined') {
            _setErrorHandlers();
        }
        break;

    case SET_NETWORK_INFO:
        JitsiMeetJS.setNetworkInfo({
            isOnline: action.isOnline
        });
        break;

    case PARTICIPANT_LEFT:
        action.participant.local && store.dispatch(disposeLib());
        break;

    case SET_CONFIG:
        return _setConfig(store, next, action);
    }

    return next(action);
});

/**
 * Notifies the feature base/lib-jitsi-meet that the action SET_CONFIG is being
 * dispatched within a specific Redux store.
 *
 * @param {Store} store - The Redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The Redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The Redux action SET_CONFIG which is being
 * dispatched in the specified store.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified action.
 */
function _setConfig({ dispatch, getState }, next, action) {
    const { initialized } = getState()['features/base/lib-jitsi-meet'];

    // XXX Since the config is changing, the library lib-jitsi-meet must be
    // initialized again with the new config. Consequently, it may need to be
    // disposed of first.
    // TODO Currently, disposeLib actually does not dispose of lib-jitsi-meet
    // because lib-jitsi-meet does not implement such functionality.
    if (initialized) {
        dispatch(disposeLib());
    }

    // Let the new config into the Redux store (because initLib will read it
    // from there).
    const result = next(action);

    // FIXME Obviously, the following is bad design. However, I'm currently
    // introducing the features base/config and base/logging and I'm trying to
    // minimize the scope of the changes while I'm attempting to preserve
    // compatibility with the existing partially React-ified Web source code and
    // what was already executing on React Native. Additionally, I do not care
    // to load logging_config.js on React Native.
    dispatch(setLoggingConfig(window.loggingConfig));

    dispatch(initLib());

    return result;
}

/**
 * Attaches our custom error handlers to the window object.
 *
 * @returns {void}
 */
function _setErrorHandlers() {
    // attaches global error handler, if there is already one, respect it
    if (JitsiMeetJS.getGlobalOnErrorHandler) {
        const oldOnErrorHandler = window.onerror;

        // eslint-disable-next-line max-params
        window.onerror = (message, source, lineno, colno, error) => {
            JitsiMeetJS.getGlobalOnErrorHandler(
                message, source, lineno, colno, error);

            if (oldOnErrorHandler) {
                oldOnErrorHandler(message, source, lineno, colno, error);
            }
        };

        const oldOnUnhandledRejection = window.onunhandledrejection;

        window.onunhandledrejection = function(event) {
            JitsiMeetJS.getGlobalOnErrorHandler(
                null, null, null, null, event.reason);

            if (oldOnUnhandledRejection) {
                oldOnUnhandledRejection(event);
            }
        };
    }
}
