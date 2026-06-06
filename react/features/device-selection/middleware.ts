import { UPDATE_DEVICE_LIST } from '../base/devices/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

/**
 * Implements the middleware of the feature device-selection.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    if (action.type === UPDATE_DEVICE_LIST) {
        const state = store.getState();
        const { availableDevices } = state['features/base/devices'] || {};

        if (typeof APP !== 'undefined') {
            APP.API.notifyDeviceListChanged(availableDevices);
        }
    }

    return result;
});
