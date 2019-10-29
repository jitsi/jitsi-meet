import { NativeModules } from 'react-native';

import { getCurrentConference } from '../../base/conference';
import { StateListenerRegistry } from '../../base/redux';

/**
 * State listener which enables / disables the proximity sensor based on the
 * current conference state. If the proximity sensor is enabled, it will dim
 * the screen and disable touch controls when an object is nearby. The
 * functionality is  enabled when the current audio device is the earpiece.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        const { devices } = state['features/mobile/audio-mode'];
        const selectedDevice = devices.filter(d => d.selected)[0];
        const conference = getCurrentConference(state);

        return Boolean(conference && selectedDevice?.type === 'EARPIECE');
    },
    /* listener */ proximityEnabled => _setProximityEnabled(proximityEnabled)
);

/**
 * Enables / disables the proximity sensor. If the proximity sensor is enabled,
 * it will dim the screen and disable touch controls when an object is nearby.
 *
 * @param {boolean} enabled - True to enable the proximity sensor or false to
 * disable it.
 * @private
 * @returns {void}
 */
function _setProximityEnabled(enabled) {
    NativeModules.Proximity.setEnabled(Boolean(enabled));
}
