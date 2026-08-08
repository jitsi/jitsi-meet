import { AnyAction } from 'redux';

import { IReduxState, IStore } from '../app/types';
import { CONFERENCE_FAILED, CONFERENCE_LEFT, CONFERENCE_WILL_LEAVE } from '../base/conference/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { getLargeVideoParticipant } from '../large-video/functions';

import {
    EMBEDDED_DOCUMENT_PIP_SIGNAL_RECEIVED,
    SET_EMBEDDED_DOCUMENT_PIP_AVAILABLE,
    SET_PIP_ACTIVE
} from './actionTypes';
import { exitPiP } from './actions';
import { getPiPVideoTrack, isDocumentPiPRequestPending, setDocumentPiPRequestPending } from './functions';
import logger from './logger';
import type { DocumentPiPSignal } from './types';

import './subscriber';

interface IEmbeddedDocumentPiPSender {
    generation: number;
    peerConnection: RTCPeerConnection;
    reconnectTimer?: number;
    sender: RTCRtpSender;
    signalQueue: Promise<void>;
    store: IStore;
}

const RECONNECT_DELAY = 1000;

let generation = 0;
let senderSession: IEmbeddedDocumentPiPSender | undefined;

function isCurrentSession(session: IEmbeddedDocumentPiPSender) {
    return senderSession === session;
}

function closeSender() {
    const session = senderSession;

    if (!session) {
        return;
    }

    senderSession = undefined;
    if (session.reconnectTimer) {
        window.clearTimeout(session.reconnectTimer);
    }
    session.peerConnection.onconnectionstatechange = null;
    session.peerConnection.onicecandidate = null;
    session.peerConnection.close();
}

function getNativePiPTrack(state: IReduxState): MediaStreamTrack | null {
    const videoTrack = getPiPVideoTrack(state, getLargeVideoParticipant(state));
    const nativeTrack = videoTrack?.jitsiTrack?.getTrack();

    return videoTrack?.muted || nativeTrack?.readyState !== 'live' ? null : nativeTrack;
}

/**
 * Replaces the native track without projecting participant state into a second
 * view model. RTCRtpSender operations use the peer connection's operations
 * chain, so a second application-level promise queue would duplicate ordering.
 *
 * @param {MediaStreamTrack|null} track - The currently selected native PiP track.
 * @returns {Promise<void>}
 */
function replaceTrack(track: MediaStreamTrack | null) {
    const session = senderSession;

    if (!session || !isCurrentSession(session) || session.sender.track === track) {
        return Promise.resolve();
    }

    return session.sender.replaceTrack(track);
}

function canReconnect(session: IEmbeddedDocumentPiPSender) {
    const pipState = session.store.getState()['features/pip'];

    return isCurrentSession(session)
        && pipState?.embeddedDocumentPiPAvailable === true
        && pipState.isPiPActive;
}

/**
 * The meeting iframe is the sole reconnect owner. Receiver failures are merely
 * restart requests; this one guarded timer advances the generation and creates
 * the replacement peer, while transient `disconnected` states are ignored.
 *
 * @param {IEmbeddedDocumentPiPSender} session - The failed current sender.
 * @param {number} expectedGeneration - Generation that requested the restart.
 * @returns {void}
 */
function scheduleReconnect(session: IEmbeddedDocumentPiPSender, expectedGeneration = session.generation) {
    if (!canReconnect(session)
            || expectedGeneration !== session.generation
            || session.reconnectTimer) {
        return;
    }

    session.reconnectTimer = window.setTimeout(() => {
        if (!canReconnect(session)) {
            return;
        }

        session.reconnectTimer = undefined;
        startSenderWithRetry(session.store);
    }, RECONNECT_DELAY);
}

/**
 * Creates the unavoidable media-plane bridge. Existing postMessage transport
 * carries control data but cannot carry a live MediaStreamTrack, so the iframe
 * offers one same-device RTCPeerConnection and trickles ICE through that
 * already-authenticated transport.
 *
 * @param {IStore} store - Redux store owning the selected PiP track.
 * @returns {Promise<void>}
 */
async function startSender(store: IStore) {
    closeSender();

    const peerConnection = new RTCPeerConnection();
    const sender = peerConnection.addTransceiver('video', { direction: 'sendonly' }).sender;
    const session: IEmbeddedDocumentPiPSender = {
        generation: ++generation,
        peerConnection,
        sender,
        signalQueue: Promise.resolve(),
        store
    };

    senderSession = session;

    peerConnection.onicecandidate = event => {
        const candidate = event.candidate;

        if (!candidate) {
            return;
        }

        if (isCurrentSession(session)) {
            APP.API.notifyDocumentPiPSignal({
                type: 'candidate',
                generation: session.generation,
                candidate: candidate.toJSON()
            });
        }
    };
    peerConnection.onconnectionstatechange = () => {
        if (isCurrentSession(session) && peerConnection.connectionState === 'failed') {
            scheduleReconnect(session);
        }
    };

    await replaceTrack(getNativePiPTrack(store.getState()));

    if (!isCurrentSession(session)) {
        return;
    }

    const offer = await peerConnection.createOffer();

    const setLocalDescription = peerConnection.setLocalDescription(offer);

    // Send the offer synchronously after starting setLocalDescription. ICE events
    // are queued tasks, so the existing postMessage transport observes SDP first.
    APP.API.notifyDocumentPiPSignal({
        type: 'offer',
        generation: session.generation,
        description: offer
    });
    await setLocalDescription;
}

function startSenderWithRetry(store: IStore) {
    startSender(store).catch(error => {
        logger.error('Failed to start embedded Document PiP:', error);
        const current = senderSession;

        if (current) {
            scheduleReconnect(current);
        }
    });
}

/**
 * Serializes answer, candidate, and restart processing. Generations make late
 * signals from a replaced peer harmless without maintaining candidate buffers
 * or parallel connection state machines.
 *
 * @param {DocumentPiPSignal} signal - Signal received from the embedding page.
 * @returns {void}
 */
function queueSignal(signal: DocumentPiPSignal) {
    const session = senderSession;

    if (!session) {
        return;
    }

    session.signalQueue = session.signalQueue
        .then(async () => {
            if (!isCurrentSession(session) || signal.generation !== session.generation) {
                return;
            }

            switch (signal.type) {
            case 'answer':
                await session.peerConnection.setRemoteDescription(signal.description);
                break;
            case 'candidate':
                await session.peerConnection.addIceCandidate(signal.candidate);
                break;
            case 'restart':
                scheduleReconnect(session, signal.generation);
                break;
            }
        })
        .catch(error => {
            logger.error('Failed to process embedded Document PiP signal:', error);
            if (isCurrentSession(session)) {
                scheduleReconnect(session);
            }
        });
}

StateListenerRegistry.register(
    /* selector */ (state: IReduxState) => {
        const pipState = state['features/pip'];

        return pipState?.embeddedDocumentPiPAvailable === true && pipState.isPiPActive
            ? getNativePiPTrack(state)
            : undefined;
    },
    /* listener */ (track: MediaStreamTrack | null | undefined) => {
        if (track !== undefined) {
            replaceTrack(track).catch(error => logger.error('Failed to update embedded Document PiP track:', error));
        }
    }
);

MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: AnyAction) => {
    const result = next(action);

    switch (action.type) {
    case SET_PIP_ACTIVE:
        if (store.getState()['features/pip']?.embeddedDocumentPiPAvailable === true) {
            if (action.isPiPActive) {
                startSenderWithRetry(store);
            } else {
                closeSender();
            }
        }
        break;
    case SET_EMBEDDED_DOCUMENT_PIP_AVAILABLE:
        if (!action.available) {
            closeSender();
        }
        break;
    case EMBEDDED_DOCUMENT_PIP_SIGNAL_RECEIVED:
        queueSignal(action.signal);
        break;
    case CONFERENCE_WILL_LEAVE:
    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:
        if (store.getState()['features/pip']?.isPiPActive) {
            store.dispatch(exitPiP());
        } else if (isDocumentPiPRequestPending()) {
            setDocumentPiPRequestPending(false);
            APP.API.notifyDocumentPiPClose();
        }
        closeSender();
        break;
    }

    return result;
});
