/* @flow */

import { AppState } from 'react-native';
import type { Dispatch } from 'redux';

import {
    _setAppStateListener,
    appStateChanged,
    setBackgroundVideoMuted
} from './actions';
import {
    _SET_APP_STATE_LISTENER,
    APP_STATE_CHANGED
} from './actionTypes';

import {
    APP_WILL_MOUNT,
    APP_WILL_UNMOUNT
} from '../app';
import { MiddlewareRegistry } from '../base/redux';


/**
 * Middleware that captures App lifetime actions and subscribes to application
 * state changes. When the application state changes it will fire the action
 * requred to mute or unmute the local video in case the application goes to
 * the backgound or comes back from it.
 *
 * @see https://facebook.github.io/react-native/docs/appstate.html
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case _SET_APP_STATE_LISTENER: {
        const bgState = store.getState()['features/background'];

        if (bgState.appStateListener) {
            AppState.removeEventListener('change', bgState.listener);
        }
        if (action.listener) {
            AppState.addEventListener('change', action.listener);
        }
        break;
    }
    case APP_STATE_CHANGED:
        _handleAppStateChange(store.dispatch, action.appState);
        break;
    case APP_WILL_MOUNT: {
        const listener
            = __onAppStateChanged.bind(undefined, store.dispatch);

        store.dispatch(_setAppStateListener(listener));
        break;
    }
    case APP_WILL_UNMOUNT:
        store.dispatch(_setAppStateListener(null));
        break;
    }

    return next(action);
});


/**
 * Handler for app state changes. If will fire the necessary actions for
 * local video to be muted when the app goes to the background, and to
 * unmute it when it comes back.
 *
 * @param  {Dispatch} dispatch - Redux dispatch function.
 * @param  {string} appState - Current app state.
 * @private
 * @returns {void}
 */
function _handleAppStateChange(dispatch: Dispatch<*>, appState: string) {
    // XXX: we purposely don't handle the 'inactive' state.
    if (appState === 'background') {
        dispatch(setBackgroundVideoMuted(true));
    } else if (appState === 'active') {
        dispatch(setBackgroundVideoMuted(false));
    }
}


/**
 * Handler called by React's AppState API indicating that the application state
 * has changed.
 *
 * @param  {Dispatch} dispatch - Redux dispatch function.
 * @param  {string} appState - The current application execution state.
 * @private
 * @returns {void}
 */
function __onAppStateChanged(dispatch: Dispatch<*>, appState: string) {
    dispatch(appStateChanged(appState));
}
