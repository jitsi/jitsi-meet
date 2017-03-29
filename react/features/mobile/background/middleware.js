/* @flow */

import { AppState } from 'react-native';
import type { Dispatch } from 'redux';

import {
    APP_WILL_MOUNT,
    APP_WILL_UNMOUNT
} from '../../app';
import { MiddlewareRegistry } from '../../base/redux';

import {
    _setAppStateListener,
    _setBackgroundVideoMuted,
    appStateChanged
} from './actions';
import {
    _SET_APP_STATE_LISTENER,
    APP_STATE_CHANGED
} from './actionTypes';

/**
 * Middleware that captures App lifetime actions and subscribes to application
 * state changes. When the application state changes it will fire the action
 * required to mute or unmute the local video in case the application goes to
 * the background or comes back from it.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 * @see {@link https://facebook.github.io/react-native/docs/appstate.html}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case _SET_APP_STATE_LISTENER: {
        // Remove the current/old AppState listener.
        const { appStateListener } = store.getState()['features/background'];

        if (appStateListener) {
            AppState.removeEventListener('change', appStateListener);
        }

        // Add the new AppState listener.
        if (action.listener) {
            AppState.addEventListener('change', action.listener);
        }
        break;
    }

    case APP_STATE_CHANGED:
        _appStateChanged(store.dispatch, action.appState);
        break;

    case APP_WILL_MOUNT:
        store.dispatch(
                _setAppStateListener(
                        _onAppStateChange.bind(undefined, store.dispatch)));
        break;

    case APP_WILL_UNMOUNT:
        store.dispatch(_setAppStateListener(null));
        break;
    }

    return next(action);
});

/**
 * Handles app state changes. Dispatches the necessary Redux actions for the
 * local video to be muted when the app goes to the background, and to be
 * unmuted when the app comes back.
 *
 * @param {Dispatch} dispatch - Redux dispatch function.
 * @param {string} appState - The current app state.
 * @private
 * @returns {void}
 */
function _appStateChanged(dispatch: Dispatch<*>, appState: string) {
    let muted;

    switch (appState) {
    case 'active':
        muted = false;
        break;

    case 'background':
        muted = true;
        break;

    case 'inactive':
    default:
        // XXX: We purposely don't handle the 'inactive' app state.
        return;
    }

    dispatch(_setBackgroundVideoMuted(muted));
}

/**
 * Called by React Native's AppState API to notify that the application state
 * has changed. Dispatches the change within the (associated) Redux store.
 *
 * @param {Dispatch} dispatch - Redux dispatch function.
 * @param {string} appState - The current application execution state.
 * @private
 * @returns {void}
 */
function _onAppStateChange(dispatch: Dispatch<*>, appState: string) {
    dispatch(appStateChanged(appState));
}
