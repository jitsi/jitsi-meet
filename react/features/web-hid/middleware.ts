import { IStore } from '../app/types';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app/actionTypes';
import { SET_AUDIO_MUTED } from '../base/media/actionTypes';
import { MEDIA_TYPE } from '../base/media/constants';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { getLocalTracks, isLocalTrackMuted } from '../base/tracks/functions.any';
import { muteLocal } from '../video-menu/actions.any';

import { CLOSE_HID_DEVICE, REQUEST_HID_DEVICE } from './actionTypes';
import { initDeviceInfo, updateDeviceInfo } from './actions';
import { getWebHidInstance, isDeviceHidSupported } from './functions';
import logger from './logger';
import { ACTION_HOOK_TYPE_NAME, COMMANDS, EVENT_TYPE } from './types';

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
    const { dispatch } = store;

    switch (action.type) {
    case APP_WILL_MOUNT: {
        const hidManager = getWebHidInstance();

        if (!hidManager.isSupported()) {
            logger.warn('HID is not supported');

            break;
        }

        const _initDeviceListener = (e: any) => dispatch(initDeviceInfo(e.detail.deviceInfo));
        const _updateDeviceListener = (e: any) => {
            dispatch(updateDeviceInfo(e.detail.deviceInfo));

            if (e.detail?.actionResult?.eventName === ACTION_HOOK_TYPE_NAME.MUTE_SWITCH_ON) {
                dispatch(muteLocal(true, MEDIA_TYPE.AUDIO));
            } else if (e.detail?.actionResult?.eventName === ACTION_HOOK_TYPE_NAME.MUTE_SWITCH_OFF) {
                dispatch(muteLocal(false, MEDIA_TYPE.AUDIO));
            }
        };

        initDeviceListener = _initDeviceListener;
        updateDeviceListener = _updateDeviceListener;

        hidManager.listenToConnectedHid();
        hidManager.addEventListener(EVENT_TYPE.INIT_DEVICE, initDeviceListener);
        hidManager.addEventListener(EVENT_TYPE.UPDATE_DEVICE, updateDeviceListener);

        break;
    }
    case APP_WILL_UNMOUNT: {
        const hidManager = getWebHidInstance();

        if (!isDeviceHidSupported()) {
            break;
        }

        if (typeof initDeviceListener === 'function') {
            hidManager.removeEventListener(EVENT_TYPE.INIT_DEVICE, initDeviceListener);
        }
        if (typeof updateDeviceListener === 'function') {
            hidManager.removeEventListener(EVENT_TYPE.UPDATE_DEVICE, updateDeviceListener);
        }

        hidManager.close();

        break;
    }
    case CLOSE_HID_DEVICE: {
        if (!isDeviceHidSupported()) {
            logger.info('HID device not supported');

            break;
        }

        const hidManager = getWebHidInstance();

        // cleanup event handlers when hid device is removed from Settings.
        if (typeof initDeviceListener === 'function') {
            hidManager.removeEventListener(EVENT_TYPE.INIT_DEVICE, initDeviceListener);
        }
        if (typeof updateDeviceListener === 'function') {
            hidManager.removeEventListener(EVENT_TYPE.UPDATE_DEVICE, updateDeviceListener);
        }

        hidManager.close();
        dispatch(muteLocal(false, MEDIA_TYPE.AUDIO));

        break;
    }
    case REQUEST_HID_DEVICE: {
        if (!isDeviceHidSupported()) {
            logger.info('HID device not supported');

            break;
        }

        const hidManager = getWebHidInstance();

        await hidManager.requestHidDevices();

        if (!hidManager.availableDevices || !hidManager.availableDevices.length) {
            logger.info('HID device not available');
            break;
        }

        const _initDeviceListener = (e: any) => dispatch(initDeviceInfo(e.detail.deviceInfo));
        const _updateDeviceListener = (e: any) => {
            dispatch(updateDeviceInfo(e.detail.deviceInfo));

            if (e.detail?.actionResult?.eventName === ACTION_HOOK_TYPE_NAME.MUTE_SWITCH_ON) {
                dispatch(muteLocal(true, MEDIA_TYPE.AUDIO));
            } else if (e.detail?.actionResult?.eventName === ACTION_HOOK_TYPE_NAME.MUTE_SWITCH_OFF) {
                dispatch(muteLocal(false, MEDIA_TYPE.AUDIO));
            }
        };

        initDeviceListener = _initDeviceListener;
        updateDeviceListener = _updateDeviceListener;

        hidManager.addEventListener(EVENT_TYPE.INIT_DEVICE, initDeviceListener);
        hidManager.addEventListener(EVENT_TYPE.UPDATE_DEVICE, updateDeviceListener);
        await hidManager.listenToConnectedHid();

        const localTracks = getLocalTracks(store.getState()['features/base/tracks']);
        const isAudioMuted = isLocalTrackMuted(localTracks, MEDIA_TYPE.AUDIO);

        // sync headset to mute if participant is already muted.
        if (isAudioMuted) {
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
