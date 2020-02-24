// FIXME: change to '../API' when we update to webpack2. If we do this now all
// files from API modules will be included in external_api.js.
import { API_ID } from '../API/constants';
import { getJitsiMeetGlobalNS } from '../../react/features/base/util';

import { PostMessageTransportBackend, Transport } from 'js-utils/transport';

export {
    PostMessageTransportBackend,
    Transport
};

/**
 * Option for the default low level transport.
 *
 * @type {Object}
 */
const postisOptions = {};

if (typeof API_ID === 'number') {
    postisOptions.scope = `jitsi_meet_external_api_${API_ID}`;
}

/**
 * The instance of Transport class that will be used by Jitsi Meet.
 *
 * @type {Transport}
 */
let transport;

/**
 * Returns the instance of Transport class that will be used by Jitsi Meet.
 *
 * @returns {Transport}
 */
export function getJitsiMeetTransport() {
    if (!transport) {
        transport = new Transport({ backend: new PostMessageTransportBackend({ postisOptions }) });
    }

    return transport;
}

/**
 * Sets the transport to passed transport.
 *
 * @param {Object} externalTransportBackend - The new transport.
 * @returns {void}
 */
getJitsiMeetGlobalNS().setExternalTransportBackend = externalTransportBackend =>
    transport.setBackend(externalTransportBackend);
