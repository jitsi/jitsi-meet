import { getAppProp } from '../../base/app';
import { MiddlewareRegistry } from '../../base/redux';
import { READY_TO_CLOSE } from '../external-api/actionTypes';


import { isExternalAPIAvailable } from './functions';

const externalAPIEnabled = isExternalAPIAvailable();

/**
 * Check if native modules are being used or not. If not then the init of middleware doesn't happen.
 */
!externalAPIEnabled && MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { type } = action;
    const leave = getAppProp(store, 'onReadyToClose');

    switch (type) {
    case READY_TO_CLOSE:
        leave();
        break;
    }


    return result;
}
);

