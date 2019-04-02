// @flow

import UIEvents from '../../../service/UI/UIEvents';

import {
    UPDATE_DEVICE_LIST,
    setAudioOutputDeviceId
} from '../base/devices';
import { MiddlewareRegistry } from '../base/redux';
import { SETTINGS_UPDATED } from '../base/settings';

declare var APP: Object;

/**
 * Implements the middleware of the feature device-selection.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    if (typeof APP === 'undefined') {
        return result;
    }

    switch (action.type) {
    case UPDATE_DEVICE_LIST: {
        const state = store.getState();
        const { popupDialogData } = state['features/device-selection'];
        const { availableDevices } = state['features/base/devices'];

        if (popupDialogData) {
            popupDialogData.transport.sendEvent({
                name: 'deviceListChanged',
                devices: availableDevices
            });
        }

        APP.API.notifyDeviceListChanged(availableDevices);

        break;
    }
    case SETTINGS_UPDATED: {
        const {
            audioOutputDeviceId,
            cameraDeviceId,
            micDeviceId
        } = action.settings;

        if (typeof cameraDeviceId !== 'undefined') {
            APP.UI.emitEvent(UIEvents.VIDEO_DEVICE_CHANGED, cameraDeviceId);
        }

        if (typeof micDeviceId !== 'undefined') {
            APP.UI.emitEvent(UIEvents.AUDIO_DEVICE_CHANGED, micDeviceId);
        }

        if (typeof audioOutputDeviceId !== 'undefined') {
            setAudioOutputDeviceId(audioOutputDeviceId, store.dispatch);
        }

        break;
    }
    }

    return result;
});
