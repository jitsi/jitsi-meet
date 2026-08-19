import type { MediaCastSignal, MediaCastSignalHandler } from './types';

interface IMediaCastReceiverOptions {
    onError?: (error: unknown) => void;
    onSignal: MediaCastSignalHandler;
    onTrack: (track: MediaStreamTrack | null) => void;
    pcConfig?: RTCConfiguration;
}

interface IReceiverSession {
    answerSent: boolean;
    generation: number;
    peerConnection: RTCPeerConnection;
    pendingCandidates: RTCIceCandidateInit[];
    restartSent: boolean;
}

/**
 * Receives one video track over a plain RTCPeerConnection.
 */
export default class MediaCastReceiver {
    private _closed = false;
    private _generation = 0;
    private _onError: (error: unknown) => void;
    private _onSignal: MediaCastSignalHandler;
    private _onTrack: (track: MediaStreamTrack | null) => void;
    private _pcConfig?: RTCConfiguration;
    private _session?: IReceiverSession;
    private _signalQueue = Promise.resolve();

    /**
     * Creates a media-cast receiver.
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
        this._signalQueue = this._signalQueue
            .then(() => this._processSignal(signal))
            .catch(error => {
                this._onError(error);
                this._requestRestart(signal.generation);
            });
    }

    /**
     * Closes the receiver and releases its remote track reference.
     *
     * @returns {void}
     */
    stop(): void {
        if (this._closed) {
            return;
        }

        this._closed = true;
        this._closeSession();
    }

    private _closeSession(): void {
        const session = this._session;

        this._session = undefined;
        this._onTrack(null);

        if (!session) {
            return;
        }

        session.peerConnection.onconnectionstatechange = null;
        session.peerConnection.onicecandidate = null;
        session.peerConnection.ontrack = null;
        session.peerConnection.close();
    }

    private async _processSignal(signal: MediaCastSignal): Promise<void> {
        if (this._closed) {
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
        case 'stop':
            this.stop();
            break;
        }
    }

    private async _handleOffer(signal: Extract<MediaCastSignal, { kind: 'offer'; }>): Promise<void> {
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
            if (this._session === session && track.kind === 'video') {
                this._onTrack(track);
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
}
