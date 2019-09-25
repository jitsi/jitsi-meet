// @flow

import { ReducerRegistry } from '../base/redux';

import {
    SPOT_DEVICES_DETECTED,
    TOGGLE_SPOT_CONTROLLER_VIEW,
    TOGGLE_SPOT_DEVICES_LIST
} from './actionTypes';

const DEFAULT_STATE = {
    device: undefined,
    devices: [],
    showControllerView: false,
    showDevicesList: false
};

/**
 * The redux redicer for the spot feature.
 */
ReducerRegistry.register('features/spot', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case SPOT_DEVICES_DETECTED:
        return {
            ...state,
            devices: action.devices
        };
    case TOGGLE_SPOT_CONTROLLER_VIEW:
        return {
            ...state,
            device: action.show && action.device,
            showControllerView: action.show
        };
    case TOGGLE_SPOT_DEVICES_LIST:
        return {
            ...state,
            showDevicesList: action.show
        };
    }

    return state;
});
