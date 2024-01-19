import { IStore } from '../app/types';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app/actionTypes';
import { getWebHIDFeatureConfig } from '../base/config/functions.web';
import { SET_AUDIO_MUTED } from '../base/media/actionTypes';
import { isAudioMuted } from '../base/media/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { CLOSE_HID_DEVICE, REQUEST_HID_DEVICE } from './actionTypes';
import { initDeviceInfo } from './actions';
import {
    attachHidEventListeners,
    getWebHidInstance,
    handleUpdateHidDevice,
    isDeviceHidSupported,
    removeHidEventListeners
} from './functions';
import logger from './logger';
import { COMMANDS, IDeviceInfo } from './types';

/**
 * A listener for initialising the webhid device.
 */
let initDeviceListener: (e: any) => void;

/**
 * A listener for updating the webhid device.
 */
let updateDeviceListener: (e: any) => void;

/**
 * The redux middleware for {@link WebHid}.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register((store: IStore) => next => async action => {
    const { dispatch, getState } = store;

    if (!getWebHIDFeatureConfig(getState())) {
        return next(action);
    }

    switch (action.type) {
    case APP_WILL_MOUNT: {
        const hidManager = getWebHidInstance();

        if (!hidManager.isSupported()) {
            logger.warn('HID is not supported');

            break;
        }

        const _initDeviceListener = (e: CustomEvent<{ deviceInfo: IDeviceInfo; }>) =>
            dispatch(initDeviceInfo(e.detail.deviceInfo));
        const _updateDeviceListener
            = (e: CustomEvent<{ actionResult: { eventName: string; }; deviceInfo: IDeviceInfo; }>) =>
                handleUpdateHidDevice(dispatch, e);


        initDeviceListener = _initDeviceListener;
        updateDeviceListener = _updateDeviceListener;

        hidManager.listenToConnectedHid();
        attachHidEventListeners(initDeviceListener, updateDeviceListener);

        break;
    }
    case APP_WILL_UNMOUNT: {
        const hidManager = getWebHidInstance();

        if (!isDeviceHidSupported()) {
            break;
        }

        removeHidEventListeners(initDeviceListener, updateDeviceListener);
        hidManager.close();

        break;
    }
    case CLOSE_HID_DEVICE: {
        const hidManager = getWebHidInstance();

        // cleanup event handlers when hid device is removed from Settings.
        removeHidEventListeners(initDeviceListener, updateDeviceListener);

        hidManager.close();

        break;
    }
    case REQUEST_HID_DEVICE: {
        const hidManager = getWebHidInstance();

        const availableDevices = await hidManager.requestHidDevices();

        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (!availableDevices || !availableDevices.length) {
            logger.info('HID device not available');
            break;
        }

        const _initDeviceListener = (e: CustomEvent<{ deviceInfo: IDeviceInfo; }>) =>
            dispatch(initDeviceInfo(e.detail.deviceInfo));
        const _updateDeviceListener
            = (e: CustomEvent<{ actionResult: { eventName: string; }; deviceInfo: IDeviceInfo; }>) => {
                handleUpdateHidDevice(dispatch, e);
            };

        initDeviceListener = _initDeviceListener;
        updateDeviceListener = _updateDeviceListener;

        attachHidEventListeners(initDeviceListener, updateDeviceListener);
        await hidManager.listenToConnectedHid();

        // sync headset to mute if participant is already muted.
        if (isAudioMuted(store.getState())) {
            hidManager.sendDeviceReport({ command: COMMANDS.MUTE_ON });
        }

        break;
    }
    case SET_AUDIO_MUTED: {
        const hidManager = getWebHidInstance();

        if (!isDeviceHidSupported()) {
            break;
        }

        hidManager.sendDeviceReport({ command: action.muted ? COMMANDS.MUTE_ON : COMMANDS.MUTE_OFF });
        break;
    }
    }

    return next(action);
});
