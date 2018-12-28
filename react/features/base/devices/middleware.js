/* global APP */

import UIEvents from '../../../../service/UI/UIEvents';

import { MiddlewareRegistry } from '../redux';

import {
    SET_AUDIO_INPUT_DEVICE,
    SET_VIDEO_INPUT_DEVICE
} from './actionTypes';

/**
 * Implements the middleware of the feature base/devices.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_AUDIO_INPUT_DEVICE:
        APP.UI.emitEvent(UIEvents.AUDIO_DEVICE_CHANGED, action.deviceId);
        break;
    case SET_VIDEO_INPUT_DEVICE:
        APP.UI.emitEvent(UIEvents.VIDEO_DEVICE_CHANGED, action.deviceId);
        break;
    }

    return next(action);
});
