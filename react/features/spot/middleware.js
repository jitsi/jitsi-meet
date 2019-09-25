// @flow

import { SpotSDK } from 'jitsi-spot-sdk';

import { APP_WILL_MOUNT } from '../base/app';
import { MiddlewareRegistry } from '../base/redux';

/**
 * The redux middleware for the spot feature.
 */
MiddlewareRegistry.register((/* store */) => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT:
        _initSpotSDK();
    }

    return next(action);
});

/**
 * Initializes the spot SDK.
 *
 * @returns {void}
 */
function _initSpotSDK() {
    SpotSDK.startDeviceDetection();
}
