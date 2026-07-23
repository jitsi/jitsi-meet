import { IStore } from '../app/types';
import { CONFERENCE_WILL_LEAVE } from '../base/conference/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';

import {
    EMBEDDED_DOCUMENT_PIP_ANSWER_RECEIVED,
    EMBEDDED_DOCUMENT_PIP_CONNECTION_STATE_CHANGED,
    EMBEDDED_DOCUMENT_PIP_ICE_RECEIVED,
    EMBEDDED_DOCUMENT_PIP_RECONNECT_REQUESTED,
    SET_EMBEDDED_DOCUMENT_PIP_CAPABILITY,
    SET_EMBEDDED_DOCUMENT_PIP_LIFECYCLE,
    SET_EMBEDDED_DOCUMENT_PIP_RENDERER_READY
} from './actionTypes';
import { clearEmbeddedDocumentPiPRequestTimer } from './actions';
import {
    IEmbeddedDocumentPiPVideoBridge,
    getEmbeddedDocumentPiPParticipant,
    getEmbeddedDocumentPiPVideoBridge
} from './embeddedDocumentPiP';
import logger from './logger';
import { EmbeddedDocumentPiPCapability, EmbeddedDocumentPiPLifecycle } from './types';

import './subscriber';

interface IEmbeddedDocumentPiPBridgeSession {
    appliedBridge: IEmbeddedDocumentPiPVideoBridge | null;
    desiredBridge: IEmbeddedDocumentPiPVideoBridge | null;
    generation: number;
    peerConnection: RTCPeerConnection;
    pendingIceCandidates: RTCIceCandidateInit[];
    reconnectTimer?: number;
    remoteDescriptionSet: boolean;
    replaceTrackChain: Promise<void>;
    store: IStore;
    videoSender: RTCRtpSender;
}

let bridgeGeneration = 0;
let bridgeSession: IEmbeddedDocumentPiPBridgeSession | undefined;

const RECONNECT_DELAY = 1000;

function getRTCConfig(state: ReturnType<IStore['getState']>): RTCConfiguration {
    const stunServers = state['features/base/config']?.p2p?.stunServers;

    if (Array.isArray(stunServers) && stunServers.length) {
        return {
            iceServers: stunServers as RTCIceServer[]
        };
    }

    return {};
}

function isCurrentSession(session: IEmbeddedDocumentPiPBridgeSession) {
    return bridgeSession === session && bridgeSession.generation === session.generation;
}

function clearReconnectTimer(session: IEmbeddedDocumentPiPBridgeSession) {
    if (session.reconnectTimer) {
        window.clearTimeout(session.reconnectTimer);
        session.reconnectTimer = undefined;
    }
}

function closePeerConnection() {
    const session = bridgeSession;

    if (!session) {
        return;
    }

    bridgeSession = undefined;
    clearReconnectTimer(session);
    session.pendingIceCandidates.length = 0;
    session.peerConnection.onconnectionstatechange = null;
    session.peerConnection.onicecandidate = null;
    session.peerConnection.oniceconnectionstatechange = null;
    session.peerConnection.close();
}

function areVideoBridgesEqual(
        current: IEmbeddedDocumentPiPVideoBridge | null,
        next: IEmbeddedDocumentPiPVideoBridge | null) {
    return current?.participantId === next?.participantId
        && current?.reduxTrack === next?.reduxTrack
        && current?.jitsiTrack === next?.jitsiTrack
        && current?.browserTrack === next?.browserTrack
        && current?.muted === next?.muted
        && current?.ready === next?.ready;
}

async function syncEmbeddedDocumentPiPVideoTrack(nextBridge: IEmbeddedDocumentPiPVideoBridge | null) {
    const session = bridgeSession;

    if (!session) {
        return;
    }

    session.desiredBridge = nextBridge;
    session.replaceTrackChain = session.replaceTrackChain
        .catch(error => logger.error('Previous embedded Document PiP track replacement failed:', error))
        .then(async () => {
            if (!isCurrentSession(session)) {
                return;
            }

            const desiredBridge = session.desiredBridge;

            if (areVideoBridgesEqual(session.appliedBridge, desiredBridge)) {
                return;
            }

            const track = desiredBridge?.ready ? desiredBridge.browserTrack : null;

            logger.info('Replacing embedded Document PiP sender track:', {
                browserTrackId: desiredBridge?.browserTrack?.id,
                generation: session.generation,
                muted: desiredBridge?.muted,
                participantId: desiredBridge?.participantId,
                ready: desiredBridge?.ready,
                readyState: desiredBridge?.browserTrack?.readyState,
                senderTrackId: session.videoSender.track?.id
            });
            await session.videoSender.replaceTrack(track);

            if (!isCurrentSession(session)) {
                return;
            }

            session.appliedBridge = desiredBridge;
            logger.info('Embedded Document PiP sender synchronized:', {
                browserTrackId: desiredBridge?.browserTrack?.id,
                generation: session.generation,
                participantId: desiredBridge?.participantId,
                senderTrackId: session.videoSender.track?.id
            });
        });

    return session.replaceTrackChain;
}

function scheduleEmbeddedDocumentPiPReconnect(expectedGeneration?: number) {
    const session = bridgeSession;
    const lifecycle = session?.store.getState()['features/pip']?.embeddedDocumentPiPLifecycle;

    if (!session
            || (expectedGeneration !== undefined && expectedGeneration !== session.generation)
            || lifecycle !== EmbeddedDocumentPiPLifecycle.ACTIVE
            || session.reconnectTimer) {
        return;
    }

    session.reconnectTimer = window.setTimeout(() => {
        if (!isCurrentSession(session)) {
            return;
        }

        session.reconnectTimer = undefined;
        startEmbeddedDocumentPiPStream(session.store).catch(error => {
            logger.error('Failed to reconnect embedded Document PiP stream:', error);
            scheduleEmbeddedDocumentPiPReconnect(session.generation);
        });
    }, RECONNECT_DELAY);
}

async function startEmbeddedDocumentPiPStream(store: IStore) {
    closePeerConnection();

    const state = store.getState();
    const rtcConfig = getRTCConfig(state);
    const peerConnection = new RTCPeerConnection(rtcConfig);
    const transceiver = peerConnection.addTransceiver('video', {
        direction: 'sendonly'
    });
    const session: IEmbeddedDocumentPiPBridgeSession = {
        appliedBridge: null,
        desiredBridge: null,
        generation: ++bridgeGeneration,
        peerConnection,
        pendingIceCandidates: [],
        remoteDescriptionSet: false,
        replaceTrackChain: Promise.resolve(),
        store,
        videoSender: transceiver.sender
    };

    bridgeSession = session;
    logger.info('Embedded Document PiP bridge created:', {
        generation: session.generation,
        participantId: getEmbeddedDocumentPiPParticipant(state)?.id
    });

    peerConnection.onicecandidate = event => {
        if (isCurrentSession(session) && event.candidate) {
            logger.debug('Embedded Document PiP local ICE candidate:', event.candidate.type);
            APP.API.notifyDocumentPiPIce({
                candidate: event.candidate.toJSON(),
                generation: session.generation
            });
        }
    };
    peerConnection.onconnectionstatechange = () => {
        if (!isCurrentSession(session)) {
            return;
        }

        const { connectionState } = peerConnection;

        logger.info('Embedded Document PiP sender connection state:', connectionState);

        if (connectionState === 'connected') {
            syncEmbeddedDocumentPiPVideoTrack(getEmbeddedDocumentPiPVideoBridge(store.getState()))
                .catch(error => logger.error('Failed to resynchronize connected Document PiP sender:', error));
        } else if (connectionState === 'failed' || connectionState === 'disconnected') {
            scheduleEmbeddedDocumentPiPReconnect();
        }
    };
    peerConnection.oniceconnectionstatechange = () => {
        if (!isCurrentSession(session)) {
            return;
        }

        const { iceConnectionState } = peerConnection;

        logger.debug('Embedded Document PiP sender ICE state:', iceConnectionState);
        if (iceConnectionState === 'failed' || iceConnectionState === 'disconnected') {
            scheduleEmbeddedDocumentPiPReconnect();
        }
    };

    await syncEmbeddedDocumentPiPVideoTrack(getEmbeddedDocumentPiPVideoBridge(state));

    if (!isCurrentSession(session)) {
        return;
    }

    const offer = await peerConnection.createOffer();

    if (!isCurrentSession(session)) {
        return;
    }

    await peerConnection.setLocalDescription(offer);

    if (!isCurrentSession(session)) {
        return;
    }

    logger.info('Embedded Document PiP offer created:', { generation: session.generation });
    APP.API.notifyDocumentPiPOffer({
        generation: session.generation,
        offer,
        rtcConfig
    });
}

async function handleEmbeddedDocumentPiPAnswer(data: {
    answer: RTCSessionDescriptionInit;
    generation: number;
}) {
    const session = bridgeSession;

    if (!session || data.generation !== session.generation) {
        return;
    }

    await session.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));

    if (!isCurrentSession(session)) {
        return;
    }

    session.remoteDescriptionSet = true;
    logger.info('Embedded Document PiP answer applied:', { generation: session.generation });

    await syncEmbeddedDocumentPiPVideoTrack(getEmbeddedDocumentPiPVideoBridge(session.store.getState()));

    if (!isCurrentSession(session)) {
        return;
    }

    while (session.pendingIceCandidates.length && isCurrentSession(session)) {
        const candidate = session.pendingIceCandidates.shift();

        if (candidate) {
            try {
                await session.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                logger.warn('Ignoring unusable queued embedded Document PiP ICE candidate:', error);
            }
        }
    }
}

async function handleEmbeddedDocumentPiPIce(data: {
    candidate: RTCIceCandidateInit;
    generation: number;
}) {
    const session = bridgeSession;

    if (!session || data.generation !== session.generation) {
        return;
    }

    if (!session.remoteDescriptionSet) {
        logger.debug('Buffering embedded Document PiP remote ICE candidate');
        session.pendingIceCandidates.push(data.candidate);

        return;
    }

    try {
        await session.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (error) {
        logger.warn('Ignoring unusable embedded Document PiP ICE candidate:', error);

        return;
    }

    if (isCurrentSession(session)) {
        logger.debug('Applied embedded Document PiP remote ICE candidate');
    }
}

function handleEmbeddedDocumentPiPConnectionState(state: {
    connectionState?: RTCPeerConnectionState | string;
    error?: string;
    generation?: number;
    iceConnectionState?: RTCIceConnectionState | string;
}) {
    const session = bridgeSession;

    if (!session || state.generation !== session.generation) {
        return;
    }

    logger.debug('Embedded Document PiP renderer connection state:', state);

    if (state.connectionState === 'failed' || state.connectionState === 'disconnected'
            || state.iceConnectionState === 'failed' || state.iceConnectionState === 'disconnected') {
        scheduleEmbeddedDocumentPiPReconnect();
    }
}

StateListenerRegistry.register(
    /* selector */ state => state['features/pip']?.embeddedDocumentPiPLifecycle
        === EmbeddedDocumentPiPLifecycle.ACTIVE
        ? getEmbeddedDocumentPiPVideoBridge(state)
        : null,
    /* listener */ (bridge: IEmbeddedDocumentPiPVideoBridge | null) => {
        syncEmbeddedDocumentPiPVideoTrack(bridge).catch(error => {
            logger.error('Failed to synchronize embedded Document PiP video track:', error);
        });
    }
);

MiddlewareRegistry.register((store: IStore) => next => action => {
    const result = next(action);

    switch (action.type) {
    case SET_EMBEDDED_DOCUMENT_PIP_RENDERER_READY:
        if (action.ready
                && store.getState()['features/pip']?.embeddedDocumentPiPLifecycle
                    === EmbeddedDocumentPiPLifecycle.ACTIVE) {
            if (!bridgeSession) {
                startEmbeddedDocumentPiPStream(store).catch(error => {
                    logger.error('Failed to start embedded Document PiP stream:', error);
                    scheduleEmbeddedDocumentPiPReconnect();
                });
            }
        } else {
            closePeerConnection();
        }
        break;
    case SET_EMBEDDED_DOCUMENT_PIP_LIFECYCLE:
        if (action.lifecycle !== EmbeddedDocumentPiPLifecycle.ACTIVE) {
            closePeerConnection();
        }
        break;
    case SET_EMBEDDED_DOCUMENT_PIP_CAPABILITY:
        if (action.capability !== EmbeddedDocumentPiPCapability.AVAILABLE) {
            closePeerConnection();
        }
        break;
    case EMBEDDED_DOCUMENT_PIP_ANSWER_RECEIVED:
        handleEmbeddedDocumentPiPAnswer(action.data).catch(error => {
            logger.error('Failed to apply embedded Document PiP answer:', error);
            scheduleEmbeddedDocumentPiPReconnect(action.data.generation);
        });
        break;
    case EMBEDDED_DOCUMENT_PIP_ICE_RECEIVED:
        handleEmbeddedDocumentPiPIce(action.data).catch(error => {
            logger.error('Failed to apply embedded Document PiP ICE candidate:', error);
        });
        break;
    case EMBEDDED_DOCUMENT_PIP_CONNECTION_STATE_CHANGED:
        handleEmbeddedDocumentPiPConnectionState(action.state);
        break;
    case EMBEDDED_DOCUMENT_PIP_RECONNECT_REQUESTED:
        scheduleEmbeddedDocumentPiPReconnect(action.generation);
        break;
    case CONFERENCE_WILL_LEAVE: {
        const pipState = store.getState()['features/pip'];
        const hasEmbeddedDocumentPiP = Boolean(bridgeSession
            || pipState?.embeddedDocumentPiPLifecycle === EmbeddedDocumentPiPLifecycle.ACTIVE
            || pipState?.embeddedDocumentPiPLifecycle === EmbeddedDocumentPiPLifecycle.REQUESTING);

        if (hasEmbeddedDocumentPiP) {
            clearEmbeddedDocumentPiPRequestTimer();
            APP.API.notifyDocumentPiPClose();
            closePeerConnection();
            store.dispatch({
                type: SET_EMBEDDED_DOCUMENT_PIP_RENDERER_READY,
                ready: false
            });
            store.dispatch({
                type: SET_EMBEDDED_DOCUMENT_PIP_LIFECYCLE,
                lifecycle: EmbeddedDocumentPiPLifecycle.IDLE
            });
        }
        break;
    }
    }

    return result;
});
