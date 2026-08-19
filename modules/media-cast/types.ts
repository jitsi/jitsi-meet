/**
 * Structured-clone-safe signalling exchanged by a media-cast sender and receiver.
 */
export type MediaCastSignal =
    | { generation: number; kind: 'offer'; sdp: RTCSessionDescriptionInit; }
    | { generation: number; kind: 'answer'; sdp: RTCSessionDescriptionInit; }
    | { candidate: RTCIceCandidateInit; generation: number; kind: 'candidate'; }
    | { generation: number; kind: 'restart'; }
    | { generation: number; kind: 'stop'; };

/**
 * Callback used to forward one media-cast signal over an application-owned transport.
 */
export type MediaCastSignalHandler = (signal: MediaCastSignal) => void;
