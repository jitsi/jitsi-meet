import KeepAwake from 'react-native-keep-awake';

import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    SET_AUDIO_ONLY
} from '../../base/conference';
import { MiddlewareRegistry } from '../../base/redux';

/**
 * Middleware that captures conference actions and activates or deactivates the
 * wake lock accordingly. If the wake lock is active, it will prevent the screen
 * from dimming.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_JOINED: {
        const { audioOnly } = store.getState()['features/base/conference'];

        _setWakeLock(!audioOnly);
        break;
    }

    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:
        _setWakeLock(false);
        break;

    case SET_AUDIO_ONLY:
        _setWakeLock(!action.audioOnly);
        break;
    }

    return next(action);
});

/**
 * Activates/deactivates the wake lock. If the wake lock is active, it will
 * prevent the screen from dimming.
 *
 * @param {boolean} wakeLock - True to active the wake lock or false to
 * deactivate it.
 * @private
 * @returns {void}
 */
function _setWakeLock(wakeLock) {
    if (wakeLock) {
        KeepAwake.activate();
    } else {
        KeepAwake.deactivate();
    }
}
