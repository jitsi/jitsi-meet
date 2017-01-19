import { StatusBar } from 'react-native';
import { Immersive } from 'react-native-immersive';

import {
    CONFERENCE_FAILED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN
} from '../base/conference';
import { Platform } from '../base/react';
import { MiddlewareRegistry } from '../base/redux';

/**
 * Middleware that captures conference actions and activates or deactivates the
 * full screen mode.  On iOS it hides the status bar, and on Android it uses the
 * immersive mode:
 * https://developer.android.com/training/system-ui/immersive.html
 * In immersive mode the status and navigation bars are hidden and thus the
 * entire screen will be covered by our application.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    let useFullScreen;

    switch (action.type) {
    case CONFERENCE_WILL_JOIN: {
        const state = store.getState()['features/base/conference'];

        useFullScreen = !state.audioOnly;
        break;
    }

    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:
        useFullScreen = false;
        break;

    default:
        useFullScreen = null;
        break;
    }

    if (useFullScreen !== null) {
        setFullScreen(useFullScreen)
            .catch(err => {
                console.warn(`Error setting full screen mode: ${err}`);
            });
    }

    return next(action);
});

/**
 * Activates/deactivates the full screen mode. On iOS it will hide the status
 * bar and On Android this will turn on immersive mode.
 *
 * @param {boolean} enabled - True to set full screen mode, false to
 * deactivate it.
 * @returns {Promise}
 */
function setFullScreen(enabled) {
    // XXX The Immersive module is only implemented on Android and throws on
    // other platforms.
    if (Platform.OS === 'android') {
        if (enabled) {
            return Immersive.on();
        }

        return Immersive.off();
    }

    StatusBar.setHidden(enabled, 'slide');

    return Promise.resolve();
}
