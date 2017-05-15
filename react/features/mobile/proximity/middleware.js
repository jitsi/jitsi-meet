import { NativeModules } from 'react-native';

import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    SET_AUDIO_ONLY
} from '../../base/conference';
import { MiddlewareRegistry } from '../../base/redux';

/**
 * Middleware which enables / disables the proximity sensor in accord with
 * conference-related actions. If the proximity sensor is enabled, it will dim
 * the screen and disable touch controls when an object is nearby. The
 * functionality is  enabled when a conference is in audio-only mode.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_JOINED: {
        const { audioOnly } = store.getState()['features/base/conference'];

        _setProximityEnabled(audioOnly);
        break;
    }

    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:
        _setProximityEnabled(false);
        break;

    case SET_AUDIO_ONLY:
        _setProximityEnabled(action.audioOnly);
        break;
    }

    return next(action);
});

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
