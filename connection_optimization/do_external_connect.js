/* global config,
          createConnectionExternally,
          getConfigParamsFromUrl,
          getRoomName */

/**
 * Implements external connect using createConnectionExternally function defined
 * in external_connect.js for Jitsi Meet. Parses the room name and token from
 * the URL and executes createConnectionExternally.
 *
 * NOTE: If you are using lib-jitsi-meet without Jitsi Meet you should use this
 * file as reference only because the implementation is Jitsi Meet-specific.
 *
 * NOTE: For optimal results this file should be included right after
 * external_connect.js.
 */

const hashParams = getConfigParamsFromUrl('hash', true);
const searchParams = getConfigParamsFromUrl('search', true);

// URL params have higher proirity than config params.
let url
    = hashParams.hasOwnProperty('config.externalConnectUrl')
        ? hashParams['config.externalConnectUrl']
        : config.externalConnectUrl;

if (url && window.createConnectionExternally) {
    const roomName = getRoomName();

    if (roomName) {
        url += `?room=${roomName}`;

        const token
            = hashParams['config.token'] || config.token || searchParams.jwt;

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
