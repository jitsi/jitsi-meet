import { API_ID } from '../API';

import Transport from './Transport';

/**
 * Option for the default low level transport.
 *
 * @type {Object}
 */
const defaultTransportOptions = {};

if (typeof API_ID === 'number') {
    defaultTransportOptions.scope
        = `jitsi_meet_external_api_${API_ID}`;
}

export const transport = new Transport({ defaultTransportOptions });

/**
 * Sets the transport to passed transport.
 *
 * @param {Object} newTransport - The new transport.
 * @returns {void}
 */
window.useNewExternalTransport = function(newTransport) {
    transport.setTransport(newTransport);
};
