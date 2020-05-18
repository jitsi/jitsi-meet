/* global config, createConnectionExternally */

import getRoomName from '../react/features/base/config/getRoomName';
import { parseURLParams } from '../react/features/base/util/parseURLParams';

/**
 * Implements external connect using createConnectionExternally function defined
 * in external_connect.js for Jitsi Meet. Parses the room name and JSON Web
 * Token (JWT) from the URL and executes createConnectionExternally.
 *
 * NOTE: If you are using lib-jitsi-meet without Jitsi Meet, you should use this
 * file as reference only because the implementation is Jitsi Meet-specific.
 *
 * NOTE: For optimal results this file should be included right after
 * external_connect.js.
 */

if (typeof createConnectionExternally === 'function') {
    // URL params have higher priority than config params.
    // Do not use external connect if websocket is enabled.
    let url
        = parseURLParams(window.location, true, 'hash')[
                'config.externalConnectUrl']
            || config.websocket ? undefined : config.externalConnectUrl;
    const isRecorder
        = parseURLParams(window.location, true, 'hash')['config.iAmRecorder'];

    let roomName;

    if (url && (roomName = getRoomName()) && !isRecorder) {
        url += `?room=${roomName}`;

        const token = parseURLParams(window.location, true, 'search').jwt;

        if (token) {
            url += `&token=${token}`;
        }

        createConnectionExternally(
            url,
            connectionInfo => {
                // Sets that global variable to be used later by connect method
                // in connection.js.
                window.XMPPAttachInfo = {
                    status: 'success',
                    data: connectionInfo
                };
                checkForConnectHandlerAndConnect();
            },
            errorCallback);
    } else {
        errorCallback();
    }
} else {
    errorCallback();
}

/**
 * Check if connect from connection.js was executed and executes the handler
 * that is going to finish the connect work.
 *
 * @returns {void}
 */
function checkForConnectHandlerAndConnect() {
    window.APP
        && window.APP.connect.status === 'ready'
        && window.APP.connect.handler();
}

/**
 * Implements a callback to be invoked if anything goes wrong.
 *
 * @param {Error} error - The specifics of what went wrong.
 * @returns {void}
 */
function errorCallback(error) {
    // The value of error is undefined if external connect is disabled.
    error && console.warn(error);

    // Sets that global variable to be used later by connect method in
    // connection.js.
    window.XMPPAttachInfo = {
        status: 'error'
    };
    checkForConnectHandlerAndConnect();
}
