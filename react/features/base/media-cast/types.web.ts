/**
 * Structured-clone-safe signalling exchanged by a media-cast sender and receiver.
 */
export type MediaCastSignal =
    | { generation: number; kind: 'offer'; sdp: RTCSessionDescriptionInit; }
    | { generation: number; kind: 'answer'; sdp: RTCSessionDescriptionInit; }
    | { candidate: RTCIceCandidateInit; generation: number; kind: 'candidate'; }
    | { generation: number; kind: 'mute'; muted: boolean; }
    | { generation: number; kind: 'restart'; }
    | { generation: number; kind: 'stop'; };

/**
 * Callback used to forward one media-cast signal over an application-owned transport.
 */
export type MediaCastSignalHandler = (signal: MediaCastSignal) => void;

/**
 * The media-cast signal kinds accepted over the transport.
 */
const MEDIA_CAST_SIGNAL_KINDS = new Set([
    'answer',
    'candidate',
    'mute',
    'offer',
    'restart',
    'stop'
]);

/**
 * Checks whether an unknown value is a well-formed media-cast signal, so malformed messages
 * received from the host are rejected before they reach the WebRTC layer.
 *
 * @param {unknown} value - Value received over the application transport.
 * @returns {boolean} Whether the value is a well-formed media-cast signal.
 */
export function isMediaCastSignal(value: unknown): value is MediaCastSignal {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const signal = value as Record<string, unknown>;
    const { kind } = signal;

    if (typeof kind !== 'string' || !MEDIA_CAST_SIGNAL_KINDS.has(kind)) {
        return false;
    }

    if (typeof signal.generation !== 'number') {
        return false;
    }

    switch (kind) {
    case 'answer':
    case 'offer': {
        const sdp = signal.sdp;

        return typeof sdp === 'object' && sdp !== null
            && typeof (sdp as { type?: unknown; }).type === 'string'
            && typeof (sdp as { sdp?: unknown; }).sdp === 'string';
    }
    case 'candidate':
        return typeof signal.candidate === 'object' && signal.candidate !== null;
    case 'mute':
        return typeof signal.muted === 'boolean';
    case 'restart':
    case 'stop':
        return true;
    default:
        return false;
    }
}

/**
 * Options for constructing a {@link MediaCastSender}.
 */
export interface IMediaCastSenderOptions {
    /**
     * Optional handler invoked with any asynchronous error encountered while sending media.
     */
    onError?: (error: unknown) => void;

    /**
     * Handler used to forward outgoing signals (offer, candidates, mute, stop) to the remote peer.
     */
    onSignal: MediaCastSignalHandler;

    /**
     * Optional RTCPeerConnection configuration (e.g. custom ICE servers) applied to new connections.
     */
    pcConfig?: RTCConfiguration;

    /**
     * Delay in milliseconds before re-establishing the connection after a failure.
     */
    reconnectDelay?: number;

    /**
     * Maximum time in milliseconds to wait for a newly offered connection to become connected.
     */
    setupTimeout?: number;
}

/**
 * State associated with one live outgoing RTCPeerConnection session.
 */
export interface ISenderSession {
    /**
     * Monotonically increasing session identifier used to discard stale signals.
     */
    generation: number;

    /**
     * The last track requested to be sent, so track updates are compared against what was
     * requested instead of the possibly-stale sender.track value.
     */
    lastRequestedTrack?: MediaStreamTrack | null;

    /**
     * Whether the last transmitted mute state has already been reported to the remote peer.
     */
    muteNotified?: boolean;

    /**
     * Whether the initial offer has been sent; ICE candidates are buffered until then.
     */
    offerSent: boolean;

    /**
     * The active RTCPeerConnection sending the video track.
     */
    peerConnection: RTCPeerConnection;

    /**
     * ICE candidates gathered before the offer was sent, flushed once it is.
     */
    pendingCandidates: RTCIceCandidateInit[];

    /**
     * The RTCRtpSender transmitting the current track.
     */
    sender: RTCRtpSender;
}

/**
 * Options for constructing a {@link MediaCastReceiver}.
 */
export interface IMediaCastReceiverOptions {
    /**
     * Optional handler invoked with any asynchronous error encountered while receiving media.
     */
    onError?: (error: unknown) => void;

    /**
     * Handler used to forward outgoing signals (answer, candidates, restart) to the remote peer.
     */
    onSignal: MediaCastSignalHandler;

    /**
     * Handler invoked whenever the received track changes; receives null when it is muted or closed.
     */
    onTrack: (track: MediaStreamTrack | null) => void;

    /**
     * Optional RTCPeerConnection configuration (e.g. custom ICE servers) applied to new connections.
     */
    pcConfig?: RTCConfiguration;
}

/**
 * State associated with one live incoming RTCPeerConnection session.
 */
export interface IReceiverSession {
    /**
     * Whether the answer to the received offer has been sent; ICE candidates are buffered until then.
     */
    answerSent: boolean;

    /**
     * Monotonically increasing session identifier used to discard stale signals.
     */
    generation: number;

    /**
     * The active RTCPeerConnection receiving the negotiated media track.
     */
    peerConnection: RTCPeerConnection;

    /**
     * ICE candidates gathered before the answer was sent, flushed once it is.
     */
    pendingCandidates: RTCIceCandidateInit[];

    /**
     * Whether an ICE restart request has already been sent for this session.
     */
    restartSent: boolean;
}
