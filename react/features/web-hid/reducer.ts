import ReducerRegistry from '../base/redux/ReducerRegistry';

import { INIT_DEVICE, UPDATE_DEVICE, UPDATE_REPORT_HID } from './actionTypes';
import { IDeviceInfo } from './types';

/**
 * The initial state of the feature testing.
 *
 * @type {{
*     reportResultMap: Map
* }}
*/
const DEFAULT_STATE = {
    deviceInfo: {} as IDeviceInfo,
    reportResultHid: new Map([
        [ 0, false ],
        [ 1, false ],
        [ 2, false ],
        [ 3, false ]
    ]
    )
};

export interface IWebHid {
    deviceInfo: IDeviceInfo;
    reportResultHid: Map<number, boolean>;
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
    case UPDATE_REPORT_HID:
        return {
            ...state,
            reportResultHid: action.reportResultHid
        };
    default:
        return state;
    }
});
