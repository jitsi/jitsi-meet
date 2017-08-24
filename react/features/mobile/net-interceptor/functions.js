import _ from 'lodash';
import XHRInterceptor from 'react-native/Libraries/Network/XHRInterceptor';

import { UPDATE_NETWORK_REQUESTS } from './actionTypes';

/**
 * Global index for keeping track of XHR requests.
 * @type {number}
 */
let reqIndex = 0;

/**
 * Starts intercepting network requests. Only XHR requests are supported at the
 * moment.
 *
 * Ongoing request information is kept in redux, and it's removed as soon as a
 * given request is complete.
 *
 * @param {Object} store - The redux store.
 * @returns {void}
 */
export function startNetInterception({ dispatch, getState }) {
    XHRInterceptor.setOpenCallback((method, url, xhr) => {
        xhr._reqIndex = reqIndex++;

        const requests = getState()['features/net-interceptor'].requests || {};
        const newRequests = _.cloneDeep(requests);
        const request = {
            method,
            url
        };

        newRequests[xhr._reqIndex] = request;

        dispatch({
            type: UPDATE_NETWORK_REQUESTS,
            requests: newRequests
        });
    });

    XHRInterceptor.setResponseCallback((...args) => {
        const xhr = args.slice(-1)[0];

        if (typeof xhr._reqIndex === 'undefined') {
            return;
        }

        const requests = getState()['features/net-interceptor'].requests || {};
        const newRequests = _.cloneDeep(requests);

        delete newRequests[xhr._reqIndex];

        dispatch({
            type: UPDATE_NETWORK_REQUESTS,
            requests: newRequests
        });
    });

    XHRInterceptor.enableInterception();
}

/**
 * Stops intercepting network requests.
 *
 * @param {Object} store - The redux store.
 * @returns {void}
 */
export function stopNetInterception({ dispatch }) {
    XHRInterceptor.disableInterception();

    dispatch({
        type: UPDATE_NETWORK_REQUESTS,
        requests: {}
    });
}
