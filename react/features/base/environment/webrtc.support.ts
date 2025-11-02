export function isWebRTCAvailable(): boolean {
    const hasRTCPeerConnection
    = typeof (window as any).RTCPeerConnection === 'function'
    || typeof (window as any).mozRTCPeerConnection === 'function'
    || typeof (window as any).webkitRTCPeerConnection === 'function';

    const hasMediaDevices
    = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');

    return hasRTCPeerConnection && hasMediaDevices;
}
