import {
    type IMediaCastReceiverOptions,
    type IReceiverSession,
    type MediaCastSignal,
    type MediaCastSignalHandler,
    isMediaCastSignal
} from './types.web';

/**
 * The subset of {@link MediaCastSignal} that carries a new SDP offer.
 */
type OfferSignal = Extract<MediaCastSignal, { kind: 'offer'; }>;

/**
 * Receives one media track over a plain RTCPeerConnection.
 *
 * The receiver owns the connection lifecycle while the caller owns the received track:
 * the current track is surfaced through the onTrack handler and released on close. Session
 * state is versioned by a generation counter so signals from superseded sessions are ignored.
 */
export default class MediaCastReceiver {
    /**
     * Whether the receiver has been permanently disposed and must ignore further signals.
     */
    private _disposed = false;

    /**
     * The media track received by the current session, if any.
     */
    private _currentTrack: MediaStreamTrack | null = null;

    /**
     * The generation of the most recently negotiated session.
     */
    private _generation = 0;

    /**
     * Whether the sender is currently transmitting a null (muted) track.
     */
    private _muted = false;

    /**
     * Handler invoked when an asynchronous receiving error occurs.
     */
    private _onError: (error: unknown) => void;

    /**
     * Handler used to forward outgoing signals to the remote peer.
     */
    private _onSignal: MediaCastSignalHandler;

    /**
     * Handler invoked whenever the received media track changes.
     */
    private _onTrack: (track: MediaStreamTrack | null) => void;

    /**
     * Optional RTCPeerConnection configuration applied to new connections.
     */
    private _pcConfig?: RTCConfiguration;

    /**
     * The live incoming session, if any.
     */
    private _session?: IReceiverSession;

    /**
     * Promise chain enforcing transport ordering of incoming signals.
     */
    private _signalQueue = Promise.resolve();

    /**
     * Creates a media-cast receiver.
     *
     * @param {IMediaCastReceiverOptions} options - Configuration for the receiver.
     */
    constructor({
        onError = () => undefined,
        onSignal,
        onTrack,
        pcConfig
    }: IMediaCastReceiverOptions) {
        this._onError = onError;
        this._onSignal = onSignal;
        this._onTrack = onTrack;
        this._pcConfig = pcConfig;
    }

    /**
     * Processes one signal in transport order.
     *
     * @param {MediaCastSignal} signal - Signal received from the remote peer.
     * @returns {void}
     */
    handleSignal(signal: MediaCastSignal): void {
        if (!isMediaCastSignal(signal)) {
            this._onError(new TypeError('Malformed media-cast signal received.'));

            return;
        }

        const generation = signal.generation;

        this._signalQueue = this._signalQueue
            .then(() => this._processSignal(signal))
            .catch(error => {
                this._onError(error);
                this._requestRestart(generation);
            });
    }

    /**
     * Stops the current session and resets generation tracking so this receiver can accept
     * a new sender whose first offer starts again at generation one.
     *
     * @returns {void}
     */
    stop(): void {
        if (this._disposed) {
            return;
        }

        this._generation = 0;
        this._closeSession();
    }

    /**
     * Permanently disposes the receiver and ignores queued or future signals.
     *
     * @returns {void}
     */
    dispose(): void {
        if (this._disposed) {
            return;
        }

        this._disposed = true;
        this._generation = 0;
        this._closeSession();
    }

    /**
     * Closes the current session's RTCPeerConnection and releases the received track.
     *
     * @returns {void}
     */
    private _closeSession(): void {
        const session = this._session;

        this._session = undefined;
        this._currentTrack = null;
        this._muted = false;
        this._onTrack(null);

        if (!session) {
            return;
        }

        session.peerConnection.onconnectionstatechange = null;
        session.peerConnection.onicecandidate = null;
        session.peerConnection.ontrack = null;
        session.peerConnection.close();
    }

    /**
     * Applies one incoming signal to the current session, or handles a new offer.
     *
     * @param {MediaCastSignal} signal - Signal received from the remote peer.
     * @returns {Promise<void>}
     */
    private async _processSignal(signal: MediaCastSignal): Promise<void> {
        if (this._disposed) {
            return;
        }

        if (signal.kind === 'offer') {
            await this._handleOffer(signal);

            return;
        }

        const session = this._session;

        if (!session || signal.generation !== session.generation) {
            return;
        }

        switch (signal.kind) {
        case 'candidate':
            await session.peerConnection.addIceCandidate(signal.candidate);
            break;
        case 'mute':
            this._setMuted(signal.muted);
            break;
        case 'stop':
            this.stop();
            break;
        }
    }

    /**
     * Negotiates an answer for an incoming offer, replacing any previous session.
     *
     * @param {OfferSignal} signal - The received offer.
     * @returns {Promise<void>}
     */
    private async _handleOffer(signal: OfferSignal): Promise<void> {
        if (signal.generation <= this._generation) {
            return;
        }

        this._closeSession();

        const peerConnection = new RTCPeerConnection(this._pcConfig);
        const session: IReceiverSession = {
            answerSent: false,
            generation: signal.generation,
            peerConnection,
            pendingCandidates: [],
            restartSent: false
        };

        this._generation = signal.generation;
        this._session = session;

        peerConnection.ontrack = ({ track }) => {
            if (this._session === session) {
                this._currentTrack = track;
                this._onTrack(this._muted ? null : track);
            }
        };
        peerConnection.onicecandidate = ({ candidate }) => {
            if (candidate && this._session === session) {
                const candidateInit = candidate.toJSON();

                if (!session.answerSent) {
                    session.pendingCandidates.push(candidateInit);

                    return;
                }

                this._onSignal({
                    candidate: candidateInit,
                    generation: session.generation,
                    kind: 'candidate'
                });
            }
        };
        peerConnection.onconnectionstatechange = () => {
            if (this._session === session && peerConnection.connectionState === 'failed') {
                this._requestRestart(session.generation);
            }
        };

        await peerConnection.setRemoteDescription(signal.sdp);

        const answer = await peerConnection.createAnswer();

        await peerConnection.setLocalDescription(answer);

        if (this._session !== session || !peerConnection.localDescription) {
            return;
        }

        const { sdp, type } = peerConnection.localDescription;

        this._onSignal({
            generation: session.generation,
            kind: 'answer',
            sdp: {
                sdp,
                type
            }
        });
        session.answerSent = true;

        for (const candidate of session.pendingCandidates.splice(0)) {
            this._onSignal({
                candidate,
                generation: session.generation,
                kind: 'candidate'
            });
        }
    }

    /**
     * Requests an ICE restart from the sender unless one is already pending for this session.
     *
     * @param {number} generation - The generation that is allowed to request a restart.
     * @returns {void}
     */
    private _requestRestart(generation: number): void {
        const session = this._session;

        if (!session || session.generation !== generation || session.restartSent) {
            return;
        }

        session.restartSent = true;
        this._onSignal({
            generation,
            kind: 'restart'
        });
    }

    /**
     * Applies the sender's mute state, re-surfacing the held track when unmuted
     * without waiting for a new ontrack event.
     *
     * @param {boolean} muted - Whether the sender is currently transmitting a null track.
     * @returns {void}
     */
    private _setMuted(muted: boolean): void {
        this._muted = muted;
        this._onTrack(muted ? null : this._currentTrack);
    }
}
