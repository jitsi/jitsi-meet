import KeepAwake from 'react-native-keep-awake';

import { getCurrentConference } from '../../base/conference';
import { StateListenerRegistry } from '../../base/redux';

/**
 * State listener that activates or deactivates the wake lock accordingly. If
 * the wake lock is active, it will prevent the screen from dimming.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        const { enabled: audioOnly } = state['features/base/audio-only'];
        const conference = getCurrentConference(state);

        return Boolean(conference && !audioOnly);
    },
    /* listener */ wakeLock => _setWakeLock(wakeLock)
);

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
