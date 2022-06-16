import _ from 'lodash';

import {
    appendURLParam,
    getBackendSafeRoomName,
    parseURIString
} from '../util';

import logger from './logger';

/**
 * Constructs options to be passed to the constructor of {@code JitsiConnection}
 * based on the redux state.
 *
 * @param {Object} state - The redux state.
 * @returns {Object} The options to be passed to the constructor of
 * {@code JitsiConnection}.
 */
export function constructOptions(state) {
    // Deep clone the options to make sure we don't modify the object in the
    // redux store.
    const options = _.cloneDeep(state['features/base/config']);

    let { bosh, websocket } = options;

    // TESTING: Only enable WebSocket for some percentage of users.
    if (websocket && navigator.product === 'ReactNative') {
        if ((Math.random() * 100) >= (options?.testing?.mobileXmppWsThreshold ?? 0)) {
            websocket = undefined;
        }
    }

    // Normalize the BOSH URL.
    if (bosh && !websocket) {
        const { locationURL } = state['features/base/connection'];

        if (bosh.startsWith('//')) {
            // By default our config.js doesn't include the protocol.
            bosh = `${locationURL.protocol}${bosh}`;
        } else if (bosh.startsWith('/')) {
            // Handle relative URLs, which won't work on mobile.
            const {
                protocol,
                host,
                contextRoot
            } = parseURIString(locationURL.href);

            bosh = `${protocol}//${host}${contextRoot || '/'}${bosh.substr(1)}`;
        }
    }

    // WebSocket is preferred over BOSH.
    const serviceUrl = websocket || bosh;

    logger.log(`Using service URL ${serviceUrl}`);

    // Append room to the URL's search.
    const { room } = state['features/base/conference'];

    if (serviceUrl && room) {
        const roomName = getBackendSafeRoomName(room);

        options.serviceUrl = appendURLParam(serviceUrl, 'room', roomName);

        if (options.websocketKeepAliveUrl) {
            options.websocketKeepAliveUrl = appendURLParam(options.websocketKeepAliveUrl, 'room', roomName);
        }
    }

    return options;
}
