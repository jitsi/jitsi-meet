import { AppState } from 'react-native';
import { AnyAction } from 'redux';

import { IStore } from '../../app/types';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../base/app/actionTypes';
import MiddlewareRegistry from '../../base/redux/MiddlewareRegistry';

import { _setAppStateSubscription, appStateChanged } from './actions';

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

    case APP_WILL_MOUNT: {
        const { dispatch } = store;

        _setAppStateListener(store, next, action, _onAppStateChange.bind(undefined, dispatch));
        break;
    }

    case APP_WILL_UNMOUNT:
        _setAppStateListener(store, next, action, undefined);
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
function _onAppStateChange(dispatch: IStore['dispatch'], appState: string) {
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
 * @param {any} listener - Listener for app state status.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _setAppStateListener({ dispatch, getState }: IStore, next: Function, action: AnyAction, listener: any) {
    const { subscription } = getState()['features/background'];
    const result = next(action);

    subscription?.remove();
    listener && dispatch(_setAppStateSubscription(AppState.addEventListener('change', listener)));

    return result;
}
