import { AnyAction } from 'redux';

import MiddlewareRegistry from '../redux/MiddlewareRegistry';
import { isEmbedded } from '../util/embedUtils';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from './actionTypes';
import logger from './logger';


/**
 * Experimental feature to monitor CPU pressure.
 */
let pressureObserver: typeof window.PressureObserver;

/**
 * Middleware which intercepts app actions to handle changes to the related state.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(() => (next: Function) => (action: AnyAction) => {

    switch (action.type) {
    case APP_WILL_MOUNT: {
        // Disable it inside an iframe until Google fixes the origin trial for 3rd party sources:
        // https://bugs.chromium.org/p/chromium/issues/detail?id=1504167
        if (!isEmbedded() && 'PressureObserver' in globalThis) {
            pressureObserver = new window.PressureObserver(
                    (records: typeof window.PressureRecord) => {
                        logger.info('Compute pressure state changed:', JSON.stringify(records));
                        if (typeof APP !== 'undefined') {
                            APP.API.notifyComputePressureChanged(records);
                        }
                    },
                    { sampleRate: 1 }
            );

            try {
                pressureObserver
                    .observe('cpu')
                    .catch((e: any) => logger.error('CPU pressure observer failed to start', e));
            } catch (e: any) {
                logger.error('CPU pressure observer failed to start', e);
            }
        }
        break;
    }
    case APP_WILL_UNMOUNT: {
        if (pressureObserver) {
            pressureObserver.unobserve('cpu');
        }
        break;
    }
    }

    return next(action);
});
