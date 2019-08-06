// @flow

import { AppState } from 'react-native';
import type { Dispatch } from 'redux';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../base/app';
import { MiddlewareRegistry } from '../../base/redux';

import {
    _setAppStateListener as _setAppStateListenerA,
    appStateChanged
} from './actions';
import { _SET_APP_STATE_LISTENER } from './actionTypes';

/**
 * Middleware that captures App lifetime actions and subscribes to application
 * state changes. When the application state changes it will fire the action
 * required to mute or unmute the local video in case the application goes to
 * the background or comes back from it.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 * @see {@link https://facebook.github.io/react-native/docs/appstate.html}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case _SET_APP_STATE_LISTENER:
        return _setAppStateListenerF(store, next, action);

    case APP_WILL_MOUNT: {
        const { dispatch } = store;

        dispatch(_setAppStateListenerA(_onAppStateChange.bind(undefined, dispatch)));
        break;
    }

    case APP_WILL_UNMOUNT:
        store.dispatch(_setAppStateListenerA(undefined));
        break;
    }

    return next(action);
});

/**
 * Called by React Native's AppState API to notify that the application state
 * has changed. Dispatches the change within the (associated) redux store.
 *
 * @param {Dispatch} dispatch - The redux {@code dispatch} function.
 * @param {string} appState - The current application execution state.
 * @private
 * @returns {void}
 */
function _onAppStateChange(dispatch: Dispatch<any>, appState: string) {
    dispatch(appStateChanged(appState));
}

/**
 * Notifies the feature filmstrip that the action
 * {@link _SET_IMMERSIVE_LISTENER} is being dispatched within a specific redux
 * store.
 *
 * @param {Store} store - The redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The redux action {@code _SET_IMMERSIVE_LISTENER}
 * which is being dispatched in the specified store.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _setAppStateListenerF({ getState }, next, action) {
    // Remove the old AppState listener and add the new one.
    const { appStateListener: oldListener } = getState()['features/background'];
    const result = next(action);
    const { appStateListener: newListener } = getState()['features/background'];

    if (oldListener !== newListener) {
        oldListener && AppState.removeEventListener('change', oldListener);
        newListener && AppState.addEventListener('change', newListener);
    }

    return result;
}
