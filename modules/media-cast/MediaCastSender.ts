import type { MediaCastSignal, MediaCastSignalHandler } from './types';

interface IMediaCastSenderOptions {
    onError?: (error: unknown) => void;
    onSignal: MediaCastSignalHandler;
    pcConfig?: RTCConfiguration;
    reconnectDelay?: number;
}

interface ISenderSession {
    generation: number;
    muteNotified?: boolean;
    offerSent: boolean;
    peerConnection: RTCPeerConnection;
    pendingCandidates: RTCIceCandidateInit[];
    sender: RTCRtpSender;
}

const DEFAULT_RECONNECT_DELAY = 1000;

/**
 * Sends one replaceable video track over a plain RTCPeerConnection.
 */
export default class MediaCastSender {
    private _active = false;
    private _generation = 0;
    private _onError: (error: unknown) => void;
    private _onSignal: MediaCastSignalHandler;
    private _pcConfig?: RTCConfiguration;
    private _reconnectDelay: number;
    private _reconnectTimer?: number;
    private _session?: ISenderSession;
    private _signalQueue = Promise.resolve();
    private _track: MediaStreamTrack | null = null;

    /**
     * Creates a media-cast sender.
     */
    constructor({
        onError = () => undefined,
        onSignal,
        pcConfig,
        reconnectDelay = DEFAULT_RECONNECT_DELAY
    }: IMediaCastSenderOptions) {
        this._onError = onError;
        this._onSignal = onSignal;
        this._pcConfig = pcConfig;
        this._reconnectDelay = reconnectDelay;
    }

    /**
     * Starts sending the supplied track. A null track keeps the negotiated video
     * transceiver alive without sending media.
     *
     * @param {MediaStreamTrack|null} track - Conference-owned input track.
     * @returns {void}
     */
    start(track: MediaStreamTrack | null): void {
        if (this._active) {
            void this.setTrack(track);

            return;
        }

        this._active = true;
        this._track = track;
        this._startSession();
    }

    /**
     * Replaces the currently transmitted track without renegotiating.
     *
     * @param {MediaStreamTrack|null} track - Conference-owned input track.
     * @returns {Promise<void>}
     */
    async setTrack(track: MediaStreamTrack | null): Promise<void> {
        this._track = track;

        const session = this._session;

        if (!this._active || !session || session.sender.track === track) {
            return;
        }

        try {
            await session.sender.replaceTrack(track);

            if (this._session === session) {
                this._notifyMute(session);
            }
        } catch (error) {
            if (this._session === session) {
                this._reportError(error);
                this._scheduleReconnect(session.generation);
            }
        }
    }

    /**
     * Processes an answer, candidate, or restart request in transport order.
     *
     * @param {MediaCastSignal} signal - Signal received from the remote peer.
     * @returns {void}
     */
    handleSignal(signal: MediaCastSignal): void {
        this._signalQueue = this._signalQueue
            .then(() => this._processSignal(signal))
            .catch(error => {
                this._reportError(error);
                this._scheduleReconnect(signal.generation);
            });
    }

    /**
     * Stops the sender without stopping or disposing the source track.
     *
     * @returns {void}
     */
    stop(): void {
        this._stop(true);
    }

    private _stop(notify: boolean): void {
        if (!this._active && !this._session) {
            return;
        }

        const generation = this._session?.generation ?? this._generation;

        this._active = false;
        this._track = null;
        this._clearReconnectTimer();
        this._closeSession();

        if (notify && generation > 0) {
            this._onSignal({
                generation,
                kind: 'stop'
            });
        }
    }

    private _clearReconnectTimer(): void {
        if (this._reconnectTimer !== undefined) {
            window.clearTimeout(this._reconnectTimer);
            this._reconnectTimer = undefined;
        }
    }

    private _closeSession(): void {
        const session = this._session;

        this._session = undefined;

        if (!session) {
            return;
        }

        session.peerConnection.onconnectionstatechange = null;
        session.peerConnection.onicecandidate = null;
        session.peerConnection.close();
    }

    private async _processSignal(signal: MediaCastSignal): Promise<void> {
        const session = this._session;

        if (!this._active || !session || signal.generation !== session.generation) {
            return;
        }

        switch (signal.kind) {
        case 'answer':
            await session.peerConnection.setRemoteDescription(signal.sdp);
            break;
        case 'candidate':
            await session.peerConnection.addIceCandidate(signal.candidate);
            break;
        case 'restart':
            this._scheduleReconnect(signal.generation);
            break;
        case 'stop':
            this._stop(false);
            break;
        }
    }

    private _notifyMute(session: ISenderSession): void {
        const muted = this._track === null;

        if (session.muteNotified === muted) {
            return;
        }

        session.muteNotified = muted;
        this._onSignal({
            generation: session.generation,
            kind: 'mute',
            muted
        });
    }

    private _reportError(error: unknown): void {
        this._onError(error);
    }

    private _scheduleReconnect(expectedGeneration: number): void {
        if (!this._active
                || this._session?.generation !== expectedGeneration
                || this._reconnectTimer !== undefined) {
            return;
        }

        this._reconnectTimer = window.setTimeout(() => {
            this._reconnectTimer = undefined;

            if (this._active && this._session?.generation === expectedGeneration) {
                this._startSession();
            }
        }, this._reconnectDelay);
    }

    private _startSession(): void {
        this._clearReconnectTimer();
        this._closeSession();

        const peerConnection = new RTCPeerConnection(this._pcConfig);
        const sender = peerConnection.addTransceiver('video', { direction: 'sendonly' }).sender;
        const session: ISenderSession = {
            generation: ++this._generation,
            offerSent: false,
            peerConnection,
            pendingCandidates: [],
            sender
        };

        this._session = session;

        peerConnection.onicecandidate = ({ candidate }) => {
            if (!candidate || this._session !== session) {
                return;
            }

            const candidateInit = candidate.toJSON();

            if (!session.offerSent) {
                session.pendingCandidates.push(candidateInit);

                return;
            }

            this._onSignal({
                candidate: candidateInit,
                generation: session.generation,
                kind: 'candidate'
            });
        };
        peerConnection.onconnectionstatechange = () => {
            if (this._session === session && peerConnection.connectionState === 'failed') {
                this._scheduleReconnect(session.generation);
            }
        };

        void this._negotiate(session);
    }

    private async _negotiate(session: ISenderSession): Promise<void> {
        try {
            await session.sender.replaceTrack(this._track);

            if (this._session !== session) {
                return;
            }

            const offer = await session.peerConnection.createOffer();

            await session.peerConnection.setLocalDescription(offer);

            if (this._session !== session || !session.peerConnection.localDescription) {
                return;
            }

            const { sdp, type } = session.peerConnection.localDescription;

            this._onSignal({
                generation: session.generation,
                kind: 'offer',
                sdp: {
                    sdp,
                    type
                }
            });
            session.offerSent = true;

            for (const candidate of session.pendingCandidates.splice(0)) {
                this._onSignal({
                    candidate,
                    generation: session.generation,
                    kind: 'candidate'
                });
            }

            this._notifyMute(session);
        } catch (error) {
            if (this._session === session) {
                this._reportError(error);
                this._scheduleReconnect(session.generation);
            }
        }
    }
}
