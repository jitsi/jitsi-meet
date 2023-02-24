import { IStore } from '../app/types';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app/actionTypes';
import { SET_AUDIO_MUTED } from '../base/media/actionTypes';
import { MEDIA_TYPE } from '../base/media/constants';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { muteLocal } from '../video-menu/actions.any';

import { REQUEST_HID_DEVICE } from './actionTypes';
import { initDeviceInfo, updateDeviceInfo, updateReportResult } from './actions.web';
import { getWebHidInstance, getWebHidState, isDeviceHidSupported } from './functions';
import { EVENT_TYPE } from './types';
import { TELEPHONY_USAGE_ACTIONS } from './utils';

/**
 * A listener for initialising the webhid device.
 */
let initDeviceListener: (e: any) => void;

/**
 * A listener for updating the webhid device.
 */
let updateDeviceListener: (e: any) => void;

/**
 * A listener for mute on action from webhid-manager.
 */
let muteOnListener: (e: any) => void;

/**
 * A listener for mute on action from webhid-manager.
 */
let muteOffListener: (e: any) => void;


/**
 * The redux middleware for {@link WebHid}.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register((store: IStore) => next => async action => {
    const { dispatch, getState } = store;
    const state = getState();

    switch (action.type) {
    case APP_WILL_MOUNT: {
        const hidManager = getWebHidInstance();

        if (!hidManager.isSupported()) {
            break;
        }

        const _initDeviceListener = (e: any) => dispatch(initDeviceInfo(e.detail.deviceInfo));
        const _updateDeviceListener = (e: any) => dispatch(updateDeviceInfo(e.detail.updatedDeviceInfo));
        const _muteOnListener = (e: any) => {
            dispatch(updateReportResult(e.detail.reportHidMap));
            dispatch(muteLocal(true, MEDIA_TYPE.AUDIO));
        };
        const _muteOffListener = (e: any) => {
            dispatch(updateReportResult(e.detail.reportHidMap));
            dispatch(muteLocal(false, MEDIA_TYPE.AUDIO));
        };

        initDeviceListener = _initDeviceListener;
        updateDeviceListener = _updateDeviceListener;
        muteOnListener = _muteOnListener;
        muteOffListener = _muteOffListener;

        hidManager.listenToConnectedHid();
        hidManager.addEventListener(EVENT_TYPE.INIT_DEVICE, initDeviceListener);
        hidManager.addEventListener(EVENT_TYPE.UPDATE_DEVICE, updateDeviceListener);
        hidManager.addEventListener(EVENT_TYPE.MUTE_ON, muteOnListener);
        hidManager.addEventListener(EVENT_TYPE.MUTE_OFF, muteOffListener);

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
        if (typeof muteOnListener === 'function') {
            hidManager.removeEventListener(EVENT_TYPE.MUTE_ON, muteOnListener);
        }
        if (typeof muteOffListener === 'function') {
            hidManager.removeEventListener(EVENT_TYPE.MUTE_OFF, muteOffListener);
        }

        break;
    }
    case REQUEST_HID_DEVICE: {
        if (!isDeviceHidSupported()) {
            break;
        }

        const hidManager = getWebHidInstance();
        const device = await hidManager.requestHidDevice();

        if (!device) {
            break;
        }

        hidManager.handleHidDevice(device);

        break;
    }
    case SET_AUDIO_MUTED: {
        const hidManager = getWebHidInstance();

        if (!isDeviceHidSupported()) {
            break;
        }

        const currentDevice = hidManager.getTelephonyDevice();

        if (!currentDevice) {
            break;
        }

        const hidState = getWebHidState(state);
        const mapHidAction = hidState.reportResultHid;

        const reports = hidManager.getReports(currentDevice);

        if (!reports) {
            break;
        }

        mapHidAction.set(0, action.muted);
        dispatch(updateReportResult(mapHidAction));
        hidManager.sendReportToDevice({
            currentDevice,
            reports,
            telephonyUsageActionId: TELEPHONY_USAGE_ACTIONS.LED_MUTE,
            valueAction: action.muted,
            reportMapResult: hidState.reportResultHid
        });
        break;
    }
    }

    return next(action);
});
