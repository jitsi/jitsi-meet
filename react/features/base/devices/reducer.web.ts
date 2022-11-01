import ReducerRegistry from '../redux/ReducerRegistry';

import {
    ADD_PENDING_DEVICE_REQUEST,
    DEVICE_PERMISSIONS_CHANGED,
    REMOVE_PENDING_DEVICE_REQUESTS,
    SET_AUDIO_INPUT_DEVICE,
    SET_VIDEO_INPUT_DEVICE,
    UPDATE_DEVICE_LIST
} from './actionTypes';
import { groupDevicesByKind } from './functions.web';
import logger from './logger';
import { IDevicesState } from './types';


const DEFAULT_STATE: IDevicesState = {
    availableDevices: {
        audioInput: [],
        audioOutput: [],
        videoInput: []
    },
    pendingRequests: [],
    permissions: {
        audio: false,
        video: false
    }
};

/**
 * Listen for actions which changes the state of known and used devices.
 *
 * @param {IDevicesState} state - The Redux state of the feature features/base/devices.
 * @param {Object} action - Action object.
 * @param {string} action.type - Type of action.
 * @param {Array<MediaDeviceInfo>} action.devices - All available audio and
 * video devices.
 * @returns {Object}
 */
ReducerRegistry.register<IDevicesState>(
    'features/base/devices',
    (state = DEFAULT_STATE, action): IDevicesState => {
        switch (action.type) {
        case UPDATE_DEVICE_LIST: {
            const deviceList = groupDevicesByKind(action.devices);

            return {
                ...state,
                availableDevices: deviceList
            };
        }

        case ADD_PENDING_DEVICE_REQUEST:
            return {
                ...state,
                pendingRequests: [
                    ...state.pendingRequests,
                    action.request
                ]
            };

        case REMOVE_PENDING_DEVICE_REQUESTS:
            return {
                ...state,
                pendingRequests: [ ]
            };

        // TODO: Changing of current audio and video device id is currently handled outside of react/redux.
        case SET_AUDIO_INPUT_DEVICE: {
            logger.debug(`set audio input device: ${action.deviceId}`);

            return state;
        }
        case SET_VIDEO_INPUT_DEVICE: {
            logger.debug(`set video input device: ${action.deviceId}`);

            return state;
        }
        case DEVICE_PERMISSIONS_CHANGED: {
            return {
                ...state,
                permissions: action.permissions
            };
        }
        default:
            return state;
        }
    });

