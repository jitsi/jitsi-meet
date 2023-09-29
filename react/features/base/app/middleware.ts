import { AnyAction } from 'redux';

import MiddlewareRegistry from '../../base/redux/MiddlewareRegistry';

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
MiddlewareRegistry.register(() => (next: Function) => async (action: AnyAction) => {

    switch (action.type) {
    case APP_WILL_MOUNT: {
        if ('PressureObserver' in globalThis) {
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
