// @flow

import { RTCPeerConnection as PC } from 'react-native-webrtc';

import { synthesizeIPv6Addresses } from './ipv6utils';

/**
 * Override PeerConnection to synthesize IPv6 addresses.
 */
export default class RTCPeerConnection extends PC {

    /**
     * Synthesize IPv6 addresses before calling the underlying setRemoteDescription.
     *
     * @param {Object} description - SDP.
     * @returns {Promise<undefined>} A promise which is resolved once the operation is complete.
     */
    async setRemoteDescription(description: Object) {
        return super.setRemoteDescription(await synthesizeIPv6Addresses(description));
    }
}
