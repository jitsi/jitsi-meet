// @flow

import { StatusBar } from 'react-native';
import { Immersive } from 'react-native-immersive';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../app';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN,
    SET_AUDIO_ONLY
} from '../../base/conference';
import { Platform } from '../../base/react';
import { MiddlewareRegistry } from '../../base/redux';

import { _setImmersiveListener } from './actions';
import { _SET_IMMERSIVE_LISTENER } from './actionTypes';

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
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const result = next(action);

    let fullScreen = null;

    switch (action.type) {
    case _SET_IMMERSIVE_LISTENER:
        // XXX The React Native module Immersive is only implemented on Android
        // and throws on other platforms.
        if (Platform.OS === 'android') {
            // Remove the current/old Immersive listener.
            const { listener } = getState()['features/full-screen'];

            listener && Immersive.removeImmersiveListener(listener);

            // Add the new listener.
            action.listener && Immersive.addImmersiveListener(action.listener);
        }
        break;

    case APP_WILL_MOUNT: {
        const context = {
            dispatch,
            getState
        };

        dispatch(
            _setImmersiveListener(_onImmersiveChange.bind(undefined, context)));
        break;
    }
    case APP_WILL_UNMOUNT:
        _setImmersiveListener(undefined);
        break;

    case CONFERENCE_WILL_JOIN:
    case CONFERENCE_JOINED:
    case SET_AUDIO_ONLY: {
        const { audioOnly, conference, joining }
            = getState()['features/base/conference'];

        fullScreen = conference || joining ? !audioOnly : false;
        break;
    }

    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:
        fullScreen = false;
        break;
    }

    fullScreen !== null && _setFullScreen(fullScreen);

    return result;
});

/**
 * Handler for Immersive mode changes. This will be called when Android's
 * immersive mode changes. This can happen without us wanting, so re-evaluate if
 * immersive mode is desired and reactivate it if needed.
 *
 * @param {Object} store - The redux store.
 * @private
 * @returns {void}
 */
function _onImmersiveChange({ getState }) {
    const state = getState();
    const { appState } = state['features/background'];

    if (appState === 'active') {
        const { audioOnly, conference, joining }
            = state['features/base/conference'];
        const fullScreen = conference || joining ? !audioOnly : false;

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

        return;
    }

    // On platforms other than Android go with whatever React Native itself
    // supports.
    StatusBar.setHidden(fullScreen, 'slide');
}
