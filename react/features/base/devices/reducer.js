import {
    ADD_PENDING_DEVICE_REQUEST,
    REMOVE_PENDING_DEVICE_REQUESTS,
    SET_AUDIO_INPUT_DEVICE,
    SET_VIDEO_INPUT_DEVICE,
    UPDATE_DEVICE_LIST
} from './actionTypes';
import { groupDevicesByKind } from './functions';

import { ReducerRegistry } from '../redux';

import logger from './logger';

const DEFAULT_STATE = {
    availableDevices: {
        audioInput: [],
        audioOutput: [],
        videoInput: []
    },
    pendingRequests: []
};

/**
 * Logs the current device list.
 *
 * @param {Object} deviceList - Whatever is returned by {@link groupDevicesByKind}.
 * @returns {string}
 */
function logDeviceList(deviceList) {
    const devicesToStr = list => list.map(device => `\t\t${device.label}[${device.deviceId}]`).join('\n');
    const audioInputs = devicesToStr(deviceList.audioInput);
    const audioOutputs = devicesToStr(deviceList.audioOutput);
    const videoInputs = devicesToStr(deviceList.videoInput);

    logger.debug('Device list updated:\n'
        + `audioInput:\n${audioInputs}\n`
        + `audioOutput:\n${audioOutputs}\n`
        + `videoInput:\n${videoInputs}`);
}

/**
 * Listen for actions which changes the state of known and used devices.
 *
 * @param {Object} state - The Redux state of the feature features/base/devices.
 * @param {Object} action - Action object.
 * @param {string} action.type - Type of action.
 * @param {Array<MediaDeviceInfo>} action.devices - All available audio and
 * video devices.
 * @returns {Object}
 */
ReducerRegistry.register(
    'features/base/devices',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case UPDATE_DEVICE_LIST: {
            const deviceList = groupDevicesByKind(action.devices);

            logDeviceList(deviceList);

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
        default:
            return state;
        }
    });

