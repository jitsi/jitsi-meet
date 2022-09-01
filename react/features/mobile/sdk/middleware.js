import { NativeModules } from 'react-native';

import { getAppProp } from '../../base/app';
import { MiddlewareRegistry } from '../../base/redux';
import { READY_TO_CLOSE } from '../external-api/actionTypes';

const { ExternalAPI } = NativeModules;
let eventEmitter;

/**
 * Check if native modules are being used or not. If not then the init of middleware doesn't happen.
 */
if (ExternalAPI === null) {
    eventEmitter = null;
}

if (eventEmitter === null) {
    MiddlewareRegistry.register(store => next => action => {
        const result = next(action);
        const { type } = action;
        const leave = getAppProp(store, 'onLeave');

        switch (type) {
        case READY_TO_CLOSE:
            leave();
            break;
        }


        return result;
    }
    );
}
