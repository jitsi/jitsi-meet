import { UPDATE_DEVICE_LIST } from '../base/devices';
import { MiddlewareRegistry } from '../base/redux';

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
        const { popupDialogData }
            = store.getState()['features/device-selection'];

        if (popupDialogData) {
            popupDialogData.transport.sendEvent({ name: 'deviceListChanged' });
        }
    }

    return result;
});
