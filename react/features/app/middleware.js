// @flow

import {
    createConnectionEvent,
    inIframe,
    sendAnalytics
} from '../analytics';
import { SET_ROOM } from '../base/conference';
import {
    CONNECTION_ESTABLISHED,
    CONNECTION_FAILED,
    getURLWithoutParams
} from '../base/connection';
import { MiddlewareRegistry } from '../base/redux';

import { reloadNow } from './actions';
import { _getRouteToRender } from './getRouteToRender';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONNECTION_ESTABLISHED:
        return _connectionEstablished(store, next, action);
    case CONNECTION_FAILED:
        return _connectionFailed(store, next, action);

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
    // lib-jitsi-meet. Consequently, the time to remove the params is
    // determined by when no one needs them anymore.
    const { history, location } = window;

    if (inIframe()) {
        return;
    }

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
 * CONNECTION_FAILED action side effects.
 *
 * @param {Object} store - The Redux store.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the specified {@code action} to
 * the specified {@code store}.
 * @param {Action} action - The redux action {@code CONNECTION_FAILED} which is being dispatched in the specified
 * {@code store}.
 * @returns {Object}
 * @private
 */
function _connectionFailed({ dispatch, getState }, next, action) {
    // In the case of a split-brain error, reload early and prevent further
    // handling of the action.
    if (_isMaybeSplitBrainError(getState, action)) {
        dispatch(reloadNow());

        return;
    }

    return next(action);
}

/**
 * Returns whether or not a CONNECTION_FAILED action is for a possible split brain error. A split brain error occurs
 * when at least two users join a conference on different bridges. It is assumed the split brain scenario occurs very
 * early on in the call.
 *
 * @param {Function} getState - The redux function for fetching the current state.
 * @param {Action} action - The redux action {@code CONNECTION_FAILED} which is being dispatched in the specified
 * {@code store}.
 * @private
 * @returns {boolean}
 */
function _isMaybeSplitBrainError(getState, action) {
    const { error } = action;
    const isShardChangedError = error
        && error.message === 'item-not-found'
        && error.details
        && error.details.shard_changed;

    if (isShardChangedError) {
        const state = getState();
        const { timeEstablished } = state['features/base/connection'];
        const { _immediateReloadThreshold } = state['features/base/config'];

        const timeSinceConnectionEstablished = timeEstablished && Date.now() - timeEstablished;
        const reloadThreshold = typeof _immediateReloadThreshold === 'number' ? _immediateReloadThreshold : 1500;

        const isWithinSplitBrainThreshold = !timeEstablished || timeSinceConnectionEstablished <= reloadThreshold;

        sendAnalytics(createConnectionEvent('failed', {
            ...error,
            connectionEstablished: timeEstablished,
            splitBrain: isWithinSplitBrainThreshold,
            timeSinceConnectionEstablished
        }));

        return isWithinSplitBrainThreshold;
    }

    return false;
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
