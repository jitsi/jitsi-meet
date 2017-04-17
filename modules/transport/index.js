import { API_ID } from '../API';
import { getJitsiMeetGlobalNS } from '../util/helpers';

import Transport from './Transport';
import PostMessageTransportBackend from './PostMessageTransportBackend';

/**
 * Option for the default low level transport.
 *
 * @type {Object}
 */
const postMessageOptions = {};

if (typeof API_ID === 'number') {
    postMessageOptions.scope
        = `jitsi_meet_external_api_${API_ID}`;
}

export const transport = new Transport({
    transport: new PostMessageTransportBackend(postMessageOptions)
});

/**
 * Sets the transport to passed transport.
 *
 * @param {Object} newTransport - The new transport.
 * @returns {void}
 */
getJitsiMeetGlobalNS().useNewExternalTransport = function(newTransport) {
    transport.setTransport(newTransport);
};
