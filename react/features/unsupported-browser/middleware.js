// @flow

import { appNavigate } from '../app';
import { SET_WEBRTC_READY } from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';

/**
 * Middleware that dispatches appNavigate when WebRTC readiness changes.
 *
 * @param {Store} store - The Redux store.
 * @returns {Function}
 * @private
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_WEBRTC_READY:
        return _setWebRTCReady(store, next, action);
    }

    return next(action);
});

/**
 * Notifies the feature unsupported-browser that the action SET_WEBRTC_READY is
 * being dispatched within a specific Redux store.
 *
 * @param {Store} store - The Redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The Redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The Redux action SET_WEBRTC_READY which is being
 * dispatched in the specified store.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified action.
 */
function _setWebRTCReady({ dispatch, getState }, next, action) {
    const result = next(action);

    // FIXME The feature unsupported-browser needs to notify the app that it may
    // need to render a different Component at its current location because the
    // execution enviroment has changed. The current location is not necessarily
    // available through window.location (e.g. on mobile) but the following
    // works at the time of this writing.
    const windowLocation = getState()['features/app'].app.getWindowLocation();

    if (windowLocation) {
        const { href } = windowLocation;

        href && dispatch(appNavigate(href));
    }

    return result;
}
