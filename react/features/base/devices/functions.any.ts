import { IReduxState } from '../../app/types';

/**
 * Returns true if there are devices of a specific type or on native platform.
 *
 * @param {Object} state - The state of the application.
 * @param {string} type - The type of device: VideoOutput | audioOutput | audioInput.
 *
 * @returns {boolean}
 */
export function hasAvailableDevices(state: IReduxState, type: string) {
    if (state['features/base/devices'] === undefined) {
        return true;
    }

    const availableDevices = state['features/base/devices'].availableDevices;

    return Number(availableDevices[type as keyof typeof availableDevices]?.length) > 0;
}
