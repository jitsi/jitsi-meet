import {
    type IMediaCastSenderOptions,
    type ISenderSession,
    type MediaCastSignal,
    type MediaCastSignalHandler,
    isMediaCastSignal
} from './types.web';

/**
 * Delay in milliseconds before re-establishing the connection after a failure.
 */
const DEFAULT_RECONNECT_DELAY = 1000;

/**
 * Maximum time in milliseconds to wait for a newly offered connection to become connected.
 */
const DEFAULT_SETUP_TIMEOUT = 10000;

/**
 * Maximum consecutive reconnection attempts before giving up on a broken connection.
 */
const MAX_RECONNECT_ATTEMPTS = 3;

/**
 * Multiplier applied to the reconnect delay after each consecutive failed attempt.
 */
const RECONNECT_DELAY_MULTIPLIER = 2;

/**
 * Sends one replaceable video track over a plain RTCPeerConnection.
 *
 * The sender owns the connection lifecycle while the caller owns the track: starting or
 * updating the track never stops or disposes the conference-owned source track. Session
 * state is versioned by a generation counter so signals from superseded sessions are ignored.
 */
export default class MediaCastSender {
    /**
     * Whether the sender has been started and may maintain a connection.
     */
    private _active = false;

    /**
     * The generation of the most recently started session.
     */
    private _generation = 0;

    /**
     * Handler invoked when an asynchronous sending error occurs.
     */
    private _onError: (error: unknown) => void;

    /**
     * Handler used to forward outgoing signals to the remote peer.
     */
    private _onSignal: MediaCastSignalHandler;

    /**
     * Optional RTCPeerConnection configuration applied to new connections.
     */
    private _pcConfig?: RTCConfiguration;

    /**
     * Number of consecutive reconnection attempts made for the current connection.
     */
    private _reconnectAttempts = 0;

    /**
     * Delay in milliseconds before re-establishing the connection after a failure.
     */
    private _reconnectDelay: number;

    /**
     * Handle of the pending reconnection timer, if any.
     */
    private _reconnectTimer?: number;

    /**
     * The live outgoing session, if any.
     */
    private _session?: ISenderSession;

    /**
     * Handle of the timer that fails a session whose offer was never answered, if any.
     */
    private _setupTimer?: number;

    /**
     * Maximum time in milliseconds to wait for a newly offered connection to become connected.
     */
    private _setupTimeout: number;

    /**
     * Promise chain enforcing transport ordering of incoming signals.
     */
    private _signalQueue = Promise.resolve();

    /**
     * The track currently being transmitted, or null to send silence.
     */
    private _track: MediaStreamTrack | null = null;

    /**
     * Creates a media-cast sender.
     *
     * @param {IMediaCastSenderOptions} options - Configuration for the sender.
     */
    constructor({
        onError = () => undefined,
        onSignal,
        pcConfig,
        reconnectDelay = DEFAULT_RECONNECT_DELAY,
        setupTimeout = DEFAULT_SETUP_TIMEOUT
    }: IMediaCastSenderOptions) {
        this._onError = onError;
        this._onSignal = onSignal;
        this._pcConfig = pcConfig;
        this._reconnectDelay = reconnectDelay;
        this._setupTimeout = setupTimeout;
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
        this._reconnectAttempts = 0;
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

        if (!this._active || !session) {
            return;
        }

        if (session.lastRequestedTrack === track) {
            return;
        }

        session.lastRequestedTrack = track;

        try {
            await session.sender.replaceTrack(track);

            // Only report the mute state once the offer has been sent: the receiver drops any
            // signal for a session it does not know yet, and the final flush in _negotiate
            // covers the state that changed while the offer was still being prepared.
            if (this._session === session && session.offerSent) {
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
        if (!isMediaCastSignal(signal)) {
            this._reportError(new TypeError('Malformed media-cast signal received.'));

            return;
        }

        const generation = signal.generation;

        this._signalQueue = this._signalQueue
            .then(() => this._processSignal(signal))
            .catch(error => {
                this._reportError(error);
                this._scheduleReconnect(generation);
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

    /**
     * Stops the sender, optionally notifying the remote peer with a stop signal.
     *
     * @param {boolean} notify - Whether to send a stop signal to the remote peer.
     * @returns {void}
     */
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

    /**
     * Cancels any pending reconnection attempt.
     *
     * @returns {void}
     */
    private _clearReconnectTimer(): void {
        if (this._reconnectTimer !== undefined) {
            window.clearTimeout(this._reconnectTimer);
            this._reconnectTimer = undefined;
        }
    }

    /**
     * Closes the current session's RTCPeerConnection and detaches its event handlers.
     *
     * @returns {void}
     */
    private _closeSession(): void {
        const session = this._session;

        this._session = undefined;
        this._clearSetupTimer();

        if (!session) {
            return;
        }

        session.peerConnection.onconnectionstatechange = null;
        session.peerConnection.onicecandidate = null;
        session.peerConnection.close();
    }

    /**
     * Applies one incoming signal to the current session if it is still current.
     *
     * @param {MediaCastSignal} signal - Signal received from the remote peer.
     * @returns {Promise<void>}
     */
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

    /**
     * Reports the current mute state to the remote peer when it changed.
     *
     * @param {ISenderSession} session - The session the mute state applies to.
     * @returns {void}
     */
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

    /**
     * Invokes the configured error handler.
     *
     * @param {unknown} error - The error that occurred.
     * @returns {void}
     */
    private _reportError(error: unknown): void {
        this._onError(error);
    }

    /**
     * Schedules a reconnection for the given generation unless one is already pending, backing
     * off after each failed attempt and giving up once MAX_RECONNECT_ATTEMPTS is reached.
     *
     * @param {number} expectedGeneration - The generation that is allowed to reconnect.
     * @returns {void}
     */
    private _scheduleReconnect(expectedGeneration: number): void {
        if (!this._active
                || this._session?.generation !== expectedGeneration
                || this._reconnectTimer !== undefined) {
            return;
        }

        if (this._reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            if (this._reconnectAttempts === MAX_RECONNECT_ATTEMPTS) {
                this._reconnectAttempts += 1;
                this._reportError(new Error('Media-cast connection could not be re-established.'));
            }

            return;
        }

        const delay = this._reconnectDelay * (RECONNECT_DELAY_MULTIPLIER ** this._reconnectAttempts);

        this._reconnectAttempts += 1;
        this._reconnectTimer = window.setTimeout(() => {
            this._reconnectTimer = undefined;

            if (this._active && this._session?.generation === expectedGeneration) {
                this._startSession();
            }
        }, delay);
    }

    /**
     * Starts the timer that fails a session whose offer was never answered, retrying through
     * _scheduleReconnect once the delay elapses with the connection still not connected.
     *
     * @param {ISenderSession} session - The session being set up.
     * @returns {void}
     */
    private _armSetupTimeout(session: ISenderSession): void {
        this._clearSetupTimer();

        this._setupTimer = window.setTimeout(() => {
            this._setupTimer = undefined;

            if (this._session === session && session.peerConnection.connectionState !== 'connected') {
                this._scheduleReconnect(session.generation);
            }
        }, this._setupTimeout);
    }

    /**
     * Cancels the setup timeout for the current session, if any.
     *
     * @returns {void}
     */
    private _clearSetupTimer(): void {
        if (this._setupTimer !== undefined) {
            window.clearTimeout(this._setupTimer);
            this._setupTimer = undefined;
        }
    }

    /**
     * Establishes a new send-only RTCPeerConnection and negotiates an offer with the remote peer.
     *
     * @returns {void}
     */
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
            if (this._session !== session) {
                return;
            }

            if (peerConnection.connectionState === 'connected') {
                this._clearSetupTimer();
                this._clearReconnectTimer();
                this._reconnectAttempts = 0;
            } else if (peerConnection.connectionState === 'failed') {
                this._clearSetupTimer();
                this._scheduleReconnect(session.generation);
            }
        };

        this._armSetupTimeout(session);

        void this._negotiate(session);
    }

    /**
     * Creates and sends the offer for a session, flushing buffered ICE candidates afterwards.
     *
     * @param {ISenderSession} session - The session being negotiated.
     * @returns {Promise<void>}
     */
    private async _negotiate(session: ISenderSession): Promise<void> {
        try {
            session.lastRequestedTrack = this._track;
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
