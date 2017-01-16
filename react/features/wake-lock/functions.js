import KeepAwake from 'react-native-keep-awake';

/**
 * Enables / disables the wake lock. If it's enabled it will prevent
 * the screen from dimming.
 *
 * @param {boolean} enabled - Action to be performed.
 * @returns {void}
 */
export function setWakeLock(enabled) {
    if (enabled) {
        KeepAwake.activate();
    } else {
        KeepAwake.deactivate();
    }
}
