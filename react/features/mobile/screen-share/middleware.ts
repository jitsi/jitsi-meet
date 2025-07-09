/* eslint-disable lines-around-comment */

import { NativeEventEmitter, NativeModules } from 'react-native';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../base/app/actionTypes';
import MiddlewareRegistry from '../../base/redux/MiddlewareRegistry';
import { toggleScreensharing } from '../../base/tracks/actions.native';

import { isScreenShareAPIAvailable } from './functions';

const screenShareApi = isScreenShareAPIAvailable();

let screenShareEventEmitter: any;

// Get the native module
const { ScheenshareEventEmiter } = NativeModules;

// Create an event emitter

if (screenShareApi) {
    screenShareEventEmitter = new NativeEventEmitter(ScheenshareEventEmiter);
}

/**
 * Middleware that captures Redux actions and uses the ExternalAPI module to
 * turn them into native events so the application knows about them.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
screenShareEventEmitter && MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { type } = action;

    switch (type) {
    case APP_WILL_MOUNT:
        _registerForNativeEvents(store);
        break;
    case APP_WILL_UNMOUNT:
        _unregisterForNativeEvents();
        break;
    }

    return result;
});

/**
 * Registers for events sent from the native side via NativeEventEmitter.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _registerForNativeEvents(store) {
    const { dispatch } = store;

    screenShareEventEmitter.addListener(ScheenshareEventEmiter.TOGGLE_SCREEN_SHARE, ({ enabled }) => {
        dispatch(toggleScreensharing(enabled));
    });
}

/**
 * Unregister for events sent from the native side via NativeEventEmitter.
 *
 * @private
 * @returns {void}
 */
function _unregisterForNativeEvents() {
    screenShareEventEmitter.removeAllListeners(ScheenshareEventEmiter.TOGGLE_SCREEN_SHARE);
}