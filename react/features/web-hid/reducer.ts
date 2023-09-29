import ReducerRegistry from '../base/redux/ReducerRegistry';

import { CLOSE_HID_DEVICE, INIT_DEVICE, UPDATE_DEVICE } from './actionTypes';
import { IDeviceInfo } from './types';

/**
 * The initial state of the web-hid feature.
*/
const DEFAULT_STATE = {
    deviceInfo: {} as IDeviceInfo
};

export interface IWebHid {
    deviceInfo: IDeviceInfo;
}


ReducerRegistry.register<IWebHid>(
'features/web-hid',
(state: IWebHid = DEFAULT_STATE, action): IWebHid => {
    switch (action.type) {
    case INIT_DEVICE:
        return {
            ...state,
            deviceInfo: action.deviceInfo
        };
    case UPDATE_DEVICE:
        return {
            ...state,
            deviceInfo: {
                ...state.deviceInfo,
                ...action.updates
            }
        };
    case CLOSE_HID_DEVICE:
        return {
            ...state,
            deviceInfo: DEFAULT_STATE.deviceInfo
        };
    default:
        return state;
    }
});
