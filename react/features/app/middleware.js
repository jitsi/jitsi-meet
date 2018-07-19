// @flow

import { SET_ROOM } from '../base/conference';
import {
    CONNECTION_ESTABLISHED,
    getURLWithoutParams
} from '../base/connection';
import { MiddlewareRegistry } from '../base/redux';

import { _getRouteToRender } from './getRouteToRender';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONNECTION_ESTABLISHED:
        return _connectionEstablished(store, next, action);

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
function _navigate({ getState }) {
    const state = getState();
    const { app } = state['features/base/app'];

    _getRouteToRender(state).then(route => app._navigate(route));
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
