import {
    MediaStream,
    MediaStreamTrack,
    RTCSessionDescription,
    RTCIceCandidate,
    mediaDevices,
    permissions
} from 'react-native-webrtc';

import RTCPeerConnection from './RTCPeerConnection';

(global => {
    if (typeof global.MediaStream === 'undefined') {
        global.MediaStream = MediaStream;
    }
    if (typeof global.MediaStreamTrack === 'undefined') {
        global.MediaStreamTrack = MediaStreamTrack;
    }
    if (typeof global.RTCIceCandidate === 'undefined') {
        global.RTCIceCandidate = RTCIceCandidate;
    }
    if (typeof global.RTCPeerConnection === 'undefined') {
        global.RTCPeerConnection = RTCPeerConnection;
    }
    if (typeof global.RTCPeerConnection === 'undefined') {
        global.webkitRTCPeerConnection = RTCPeerConnection;
    }
    if (typeof global.RTCSessionDescription === 'undefined') {
        global.RTCSessionDescription = RTCSessionDescription;
    }

    const navigator = global.navigator;

    if (navigator) {
        if (typeof navigator.mediaDevices === 'undefined') {
            navigator.mediaDevices = mediaDevices;
        }
        if (typeof navigator.permissions === 'undefined') {
            navigator.permissions = permissions;
        }
    }

})(global || window || this); // eslint-disable-line no-invalid-this
