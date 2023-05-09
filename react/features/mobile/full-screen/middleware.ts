// @ts-expect-error
import { Immersive } from 'react-native-immersive';
import { AnyAction } from 'redux';

import { IStore } from '../../app/types';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../base/app/actionTypes';
import { getCurrentConference } from '../../base/conference/functions';
import { isAnyDialogOpen } from '../../base/dialog/functions';
import { FULLSCREEN_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import Platform from '../../base/react/Platform.native';
import MiddlewareRegistry from '../../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../../base/redux/StateListenerRegistry';

import { _SET_IMMERSIVE_LISTENER } from './actionTypes';
import { _setImmersiveListener as _setImmersiveListenerA } from './actions';

/**
 * Middleware that captures conference actions and activates or deactivates the
 * full screen mode. On iOS it hides the status bar, and on Android it uses the
 * immersive mode:
 * https://developer.android.com/training/system-ui/immersive.html
 * In immersive mode the status and navigation bars are hidden and thus the
 * entire screen will be covered by our application.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case _SET_IMMERSIVE_LISTENER:
        return _setImmersiveListenerF(store, next, action);

    case APP_WILL_MOUNT: {
        const result = next(action);

        store.dispatch(
            _setImmersiveListenerA(_onImmersiveChange.bind(undefined, store)));

        return result;
    }

    case APP_WILL_UNMOUNT:
        store.dispatch(_setImmersiveListenerA(undefined));
        break;

    }

    return next(action);
});

StateListenerRegistry.register(
    /* selector */ state => {
        const { enabled: audioOnly } = state['features/base/audio-only'];
        const conference = getCurrentConference(state);
        const dialogOpen = isAnyDialogOpen(state);
        const fullscreenEnabled = getFeatureFlag(state, FULLSCREEN_ENABLED, true);

        return conference ? !audioOnly && !dialogOpen && fullscreenEnabled : false;
    },
    /* listener */ fullScreen => _setFullScreen(fullScreen)
);

/**
 * Handler for Immersive mode changes. This will be called when Android's
 * immersive mode changes. This can happen without us wanting, so re-evaluate if
 * immersive mode is desired and reactivate it if needed.
 *
 * @param {Object} store - The redux store.
 * @private
 * @returns {void}
 */
function _onImmersiveChange({ getState }: IStore) {
    const state = getState();
    const { appState } = state['features/background'];

    if (appState === 'active') {
        const { enabled: audioOnly } = state['features/base/audio-only'];
        const conference = getCurrentConference(state);
        const dialogOpen = isAnyDialogOpen(state);
        const fullscreenEnabled = getFeatureFlag(state, FULLSCREEN_ENABLED, true);
        const fullScreen = conference ? !audioOnly && !dialogOpen && fullscreenEnabled : false;

        _setFullScreen(fullScreen);
    }
}

/**
 * Activates/deactivates the full screen mode. On iOS it will hide the status
 * bar, and on Android it will turn immersive mode on.
 *
 * @param {boolean} fullScreen - True to set full screen mode, false to
 * deactivate it.
 * @private
 * @returns {void}
 */
function _setFullScreen(fullScreen: boolean) {
    // XXX The React Native module Immersive is only implemented on Android and
    // throws on other platforms.
    if (Platform.OS === 'android') {
        fullScreen ? Immersive.on() : Immersive.off();
    }
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
function _setImmersiveListenerF({ getState }: IStore, next: Function, action: AnyAction) {
    // XXX The React Native module Immersive is only implemented on Android and
    // throws on other platforms.
    if (Platform.OS === 'android') {
        // Remove the old Immersive listener and add the new one.
        const { listener: oldListener } = getState()['features/full-screen'];
        const result = next(action);
        const { listener: newListener } = getState()['features/full-screen'];

        if (oldListener !== newListener) {
            oldListener && Immersive.removeImmersiveListener(oldListener);
            newListener && Immersive.addImmersiveListener(newListener);
        }

        return result;
    }

    return next(action);
}
