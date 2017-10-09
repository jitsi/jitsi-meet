/* @flow */

import { StatusBar } from 'react-native';
import { Immersive } from 'react-native-immersive';

import { APP_STATE_CHANGED } from '../background';
import {
    CONFERENCE_FAILED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN,
    SET_AUDIO_ONLY
} from '../../base/conference';
import { HIDE_DIALOG } from '../../base/dialog';
import { Platform } from '../../base/react';
import { MiddlewareRegistry } from '../../base/redux';

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
MiddlewareRegistry.register(({ getState }) => next => action => {
    const result = next(action);

    let fullScreen = null;

    switch (action.type) {
    case APP_STATE_CHANGED:
    case CONFERENCE_WILL_JOIN:
    case HIDE_DIALOG:
    case SET_AUDIO_ONLY: {
        // Check if we just came back from the background and re-enable full
        // screen mode if necessary.
        const { appState } = action;

        if (typeof appState !== 'undefined' && appState !== 'active') {
            break;
        }

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

    if (fullScreen !== null) {
        _setFullScreen(fullScreen)
            .catch(err =>
                console.warn(`Failed to set full screen mode: ${err}`));
    }

    return result;
});

/**
 * Activates/deactivates the full screen mode. On iOS it will hide the status
 * bar, and on Android it will turn immersive mode on.
 *
 * @param {boolean} fullScreen - True to set full screen mode, false to
 * deactivate it.
 * @private
 * @returns {Promise}
 */
function _setFullScreen(fullScreen: boolean) {
    // XXX The React Native module Immersive is only implemented on Android and
    // throws on other platforms.
    if (Platform.OS === 'android') {
        return fullScreen ? Immersive.on() : Immersive.off();
    }

    // On platforms other than Android go with whatever React Native itself
    // supports.
    StatusBar.setHidden(fullScreen, 'slide');

    return Promise.resolve();
}
