import { SET_ROOM } from '../base/conference';
import {
    CONNECTION_ESTABLISHED,
    getURLWithoutParams,
    SET_LOCATION_URL
} from '../base/connection';
import { MiddlewareRegistry } from '../base/redux';
import { createInitialLocalTracks, destroyLocalTracks } from '../base/tracks';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONNECTION_ESTABLISHED:
        return _connectionEstablished(store, next, action);

    case SET_LOCATION_URL:
        return _setLocationURL(store, next, action);

    case SET_ROOM:
        return _setRoom(store, next, action);
    }

    return next(action);
});

/**
 * Notifies the feature app that the action {@link CONNECTION_ESTABLISHED} is
 * being dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code CONNECTION_ESTABLISHED}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
function _connectionEstablished(store, next, action) {
    const result = next(action);

    // In the Web app we explicitly do not want to display the hash and
    // query/search URL params. Unfortunately, window.location and, more
    // importantly, its params are used not only in jitsi-meet but also in
    // lib-jitsi-meet. Consequenlty, the time to remove the params is
    // determined by when no one needs them anymore.
    const { history, location } = window;

    if (history
            && location
            && history.length
            && typeof history.replaceState === 'function') {
        const replacement = getURLWithoutParams(location);

        if (location !== replacement) {
            history.replaceState(
                history.state,
                (document && document.title) || '',
                replacement);
        }
    }

    return result;
}

/**
 * Navigates to a route in accord with a specific redux state.
 *
 * @param {Store} store - The redux store which determines/identifies the route
 * to navigate to.
 * @private
 * @returns {void}
 */
function _navigate({ dispatch, getState }) {
    const state = getState();
    const { app, getRouteToRender } = state['features/app'];
    const routeToRender = getRouteToRender && getRouteToRender(state);

    // FIXME The following is logic specific to the user experience of the
    // mobile/React Native app. Firstly, I don't like that it's here at all.
    // Secondly, I copied the mobile/React Native detection from
    // react/features/base/config/reducer.js because I couldn't iron out an
    // abstraction. Because of the first point, I'm leaving the second point
    // unresolved to attract attention to the fact that the following needs more
    // thinking.
    if (navigator.product === 'ReactNative') {
        // Create/destroy the local tracks as needed: create them the first time
        // we are going to render an actual route (be that the WelcomePage or
        // the Conference).
        //
        // When the WelcomePage is disabled, the app will transition to the
        // null/undefined route. Detect these transitions and create/destroy the
        // local tracks so the camera doesn't stay open if the app is not
        // rendering any component.
        if (typeof routeToRender === 'undefined' || routeToRender === null) {
            // Destroy the local tracks if there is no route to render and there
            // is no WelcomePage.
            app.props.welcomePageEnabled || dispatch(destroyLocalTracks());
        } else {
            // Create the local tracks if they haven't been created yet.
            state['features/base/tracks'].some(t => t.local)
                || dispatch(createInitialLocalTracks());
        }
    }

    app._navigate(routeToRender);
}

/**
 * Notifies the feature app that the action {@link SET_LOCATION_URL} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action, {@code SET_LOCATION_URL}, which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
function _setLocationURL({ getState }, next, action) {
    const result = next(action);

    getState()['features/app'].app._navigate(undefined);

    return result;
}

/**
 * Notifies the feature app that the action {@link SET_ROOM} is being dispatched
 * within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action, {@code SET_ROOM}, which is being
 * dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
function _setRoom(store, next, action) {
    const result = next(action);

    _navigate(store);

    return result;
}
