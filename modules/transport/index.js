import { API_ID } from '../API';
import { getJitsiMeetGlobalNS } from '../util/helpers';

import Transport from './Transport';
import PostMessageTransportBackend from './PostMessageTransportBackend';

/**
 * Option for the default low level transport.
 *
 * @type {Object}
 */
const postisOptions = {};

if (typeof API_ID === 'number') {
    postisOptions.scope
        = `jitsi_meet_external_api_${API_ID}`;
}

export const transport = new Transport({
    transport: new PostMessageTransportBackend({
        enableLegacyFormat: true,
        postisOptions
    })
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
