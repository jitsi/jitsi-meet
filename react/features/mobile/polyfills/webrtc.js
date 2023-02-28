import { registerGlobals } from 'react-native-webrtc';

import RTCPeerConnection from './RTCPeerConnection';

registerGlobals();

(global => {
    // Override with ours.
    // TODO: consider dropping our override.
    global.RTCPeerConnection = RTCPeerConnection;
})(global || window || this); // eslint-disable-line no-invalid-this
