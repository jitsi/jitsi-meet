// FIXME: change to '../API' when we update to webpack2. If we do this now all
// files from API modules will be included in external_api.js.
import { EmbeddedTransportBackend, PostMessageTransportBackend, Transport } from '@jitsi/js-utils/transport';

import { getJitsiMeetGlobalNS } from '../../react/features/base/util/helpers';
import { API_ID } from '../API/constants';

export {
    EmbeddedTransportBackend,
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
 * Sets the transport to passed transport. Ensures the transport instance
 * is initialized before attempting to swap the backend.
 *
 * @param {Object} externalTransportBackend - The new transport backend.
 * @returns {void}
 */
getJitsiMeetGlobalNS().setExternalTransportBackend = externalTransportBackend => {
    // Ensure transport is initialized before swapping the backend.
    // This is important for embedded mode where setExternalTransportBackend
    // may be called before getJitsiMeetTransport().
    if (!transport) {
        getJitsiMeetTransport();
    }

    transport.setBackend(externalTransportBackend);
};
