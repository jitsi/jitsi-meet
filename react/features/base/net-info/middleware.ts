import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../app/actionTypes';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import NetworkInfoService from './NetworkInfoService';
import { _storeNetworkInfoCleanup, setNetworkInfo } from './actions';
import { STORE_NAME } from './constants';
import { ONLINE_STATE_CHANGED_EVENT } from './events';
import logger from './logger';
import type { NetworkInfo } from './types';

/**
 * Middleware for 'base/net-info' feature.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_WILL_MOUNT:
        if (NetworkInfoService.isSupported()) {
            const networkInfoService = new NetworkInfoService();
            const stop = () => {
                networkInfoService.stop();

                // @ts-ignore
                networkInfoService.removeAllListeners();
            };

            // @ts-ignore
            networkInfoService.addListener(
                ONLINE_STATE_CHANGED_EVENT,
                ({ isOnline, networkType, details }: NetworkInfo) => {
                    logger.info('Network changed', JSON.stringify({
                        isOnline,
                        details,
                        networkType
                    }));
                    dispatch(setNetworkInfo({
                        isOnline,
                        networkType,
                        details
                    }));
                });

            dispatch(_storeNetworkInfoCleanup(stop));

            networkInfoService.start();
        }
        break;
    case APP_WILL_UNMOUNT: {
        const { _cleanup } = getState()[STORE_NAME];

        if (_cleanup) {
            _cleanup();
            dispatch(_storeNetworkInfoCleanup(undefined));
        }
    }
        break;
    }

    return result;
});
