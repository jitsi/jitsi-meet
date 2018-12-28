/* @flow */

import XHRInterceptor from 'react-native/Libraries/Network/XHRInterceptor';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../base/app';
import { MiddlewareRegistry } from '../../base/redux';

import {
    _ADD_NETWORK_REQUEST,
    _REMOVE_ALL_NETWORK_REQUESTS,
    _REMOVE_NETWORK_REQUEST
} from './actionTypes';

/**
 * Middleware which captures app startup and conference actions in order to
 * clear the image cache.
 *
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_WILL_MOUNT:
        _startNetInterception(store);
        break;

    case APP_WILL_UNMOUNT:
        _stopNetInterception(store);
        break;
    }

    return result;
});

/**
 * Starts intercepting network requests. Only XHR requests are supported at the
 * moment.
 *
 * Ongoing request information is kept in redux, and it's removed as soon as a
 * given request is complete.
 *
 * @param {Object} store - The redux store.
 * @private
 * @returns {void}
 */
function _startNetInterception({ dispatch }) {
    XHRInterceptor.setOpenCallback((method, url, xhr) => dispatch({
        type: _ADD_NETWORK_REQUEST,
        request: xhr,

        // The following are not really necessary read anywhere at the time of
        // this writing but are provided anyway if the reducer chooses to
        // remember them:
        method,
        url
    }));
    XHRInterceptor.setResponseCallback((...args) => dispatch({
        type: _REMOVE_NETWORK_REQUEST,

        // XXX The XHR is the last argument of the responseCallback.
        request: args[args.length - 1]
    }));

    XHRInterceptor.enableInterception();
}

/**
 * Stops intercepting network requests.
 *
 * @param {Object} store - The redux store.
 * @private
 * @returns {void}
 */
function _stopNetInterception({ dispatch }) {
    XHRInterceptor.disableInterception();

    dispatch({
        type: _REMOVE_ALL_NETWORK_REQUESTS
    });
}
