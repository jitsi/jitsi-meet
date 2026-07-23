import { MessageChannelTransportBackend, Transport } from '@jitsi/js-utils/transport';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import EmbeddedPiPView from './components/embedded/EmbeddedPiPView';
import { IEmbeddedDocumentPiPViewModel } from './embeddedDocumentPiP';
import { DOCUMENT_PIP_TRANSPORT_SCOPE } from './external-api.shared';
import logger from './logger';

const CONNECTION_RETRY_TIMEOUT = 5000;

function getParentOrigin() {
    const configuredOrigin = new URLSearchParams(window.location.search).get('parentOrigin');

    if (configuredOrigin) {
        return new URL(configuredOrigin).origin;
    }

    if (!document.referrer) {
        throw new Error('Document PiP renderer requires a parent referrer origin');
    }

    return new URL(document.referrer).origin;
}

const transport = new Transport({
    backend: new MessageChannelTransportBackend({
        origin: getParentOrigin(),
        scope: DOCUMENT_PIP_TRANSPORT_SCOPE
    })
});

function post(name: string, data?: any) {
    transport.sendEvent({
        data,
        name
    });
}

function DocumentPiPRenderer() {
    const [ state, setState ] = useState<Partial<IEmbeddedDocumentPiPViewModel>>({});
    const [ hasPlayableVideo, setHasPlayableVideo ] = useState(false);
    const bridgeGenerationRef = useRef<number>();
    const videoRef = useRef<HTMLVideoElement>(null);
    const offerGenerationRef = useRef(0);
    const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
    const peerConnectionRef = useRef<RTCPeerConnection>();
    const reconnectTimerRef = useRef<number>();
    const onAudioClick = useCallback(() => post('command', 'toggle-audio'), []);
    const onVideoClick = useCallback(() => post('command', 'toggle-video'), []);
    const onHangupClick = useCallback(() => post('command', 'hangup'), []);
    const onVideoLoadedData = useCallback(() => {
        const video = videoRef.current;

        setHasPlayableVideo(true);
        logger.info('Embedded Document PiP renderer video loaded:', {
            readyState: video?.readyState,
            receiverTrackId: (video?.srcObject as MediaStream | null)?.getVideoTracks()[0]?.id
        });
    }, []);
    const onVideoPlaying = useCallback(() => {
        const video = videoRef.current;

        setHasPlayableVideo(true);
        logger.info('Embedded Document PiP renderer video playing:', {
            readyState: video?.readyState,
            receiverTrackId: (video?.srcObject as MediaStream | null)?.getVideoTracks()[0]?.id
        });
    }, []);

    useEffect(() => {
        const clearReconnectTimer = () => {
            if (reconnectTimerRef.current) {
                window.clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = undefined;
            }
        };

        const scheduleReconnect = () => {
            clearReconnectTimer();
            reconnectTimerRef.current = window.setTimeout(() => {
                post('reconnect', { generation: bridgeGenerationRef.current });
            }, CONNECTION_RETRY_TIMEOUT);
        };

        const closePeerConnection = () => {
            peerConnectionRef.current?.close();
            peerConnectionRef.current = undefined;
            pendingIceCandidatesRef.current = [];
            setHasPlayableVideo(false);

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };

        async function handleOffer(data: {
            generation: number;
            offer: RTCSessionDescriptionInit;
            rtcConfig?: RTCConfiguration;
        }) {
            const generation = ++offerGenerationRef.current;

            closePeerConnection();
            scheduleReconnect();

            const peerConnection = new RTCPeerConnection(data.rtcConfig);
            const isCurrentPeerConnection = () => peerConnectionRef.current === peerConnection
                && offerGenerationRef.current === generation;

            peerConnectionRef.current = peerConnection;
            bridgeGenerationRef.current = data.generation;
            peerConnection.ontrack = event => {
                const playVideo = () => {
                    if (!isCurrentPeerConnection() || !videoRef.current) {
                        return;
                    }

                    videoRef.current.srcObject = new MediaStream([ event.track ]);
                    videoRef.current.play()
                        .then(() => logger.info('Embedded Document PiP renderer play requested:', {
                            readyState: videoRef.current?.readyState,
                            receiverTrackId: event.track.id
                        }))
                        .catch(error => {
                            logger.error('Embedded Document PiP renderer video playback failed:', error);
                            setHasPlayableVideo(false);
                            post('connection-state', {
                                connectionState: peerConnection.connectionState,
                                error: error instanceof Error ? error.message : String(error),
                                generation: data.generation,
                                stage: 'play'
                            });
                        });
                };

                if (!isCurrentPeerConnection()) {
                    return;
                }

                logger.info('Embedded Document PiP renderer received video track:', {
                    generation,
                    muted: event.track.muted,
                    readyState: event.track.readyState,
                    trackId: event.track.id
                });
                if (videoRef.current) {
                    playVideo();
                }

                event.track.onended = () => {
                    if (!isCurrentPeerConnection()) {
                        return;
                    }

                    logger.info('Embedded Document PiP renderer track ended:', event.track.id);
                    setHasPlayableVideo(false);
                };
                event.track.onmute = () => {
                    if (!isCurrentPeerConnection()) {
                        return;
                    }

                    logger.info('Embedded Document PiP renderer track muted:', event.track.id);
                    setHasPlayableVideo(false);
                };
                event.track.onunmute = () => {
                    if (!isCurrentPeerConnection()) {
                        return;
                    }

                    logger.info('Embedded Document PiP renderer track unmuted:', event.track.id);
                    playVideo();
                };
            };
            peerConnection.onicecandidate = event => {
                if (isCurrentPeerConnection() && event.candidate) {
                    post('ice', {
                        candidate: event.candidate.toJSON(),
                        generation: data.generation
                    });
                }
            };

            const reportConnectionState = () => {
                if (!isCurrentPeerConnection()) {
                    return;
                }

                const connectionState = peerConnection.connectionState;
                const iceConnectionState = peerConnection.iceConnectionState;

                post('connection-state', {
                    connectionState,
                    generation: data.generation,
                    iceConnectionState
                });

                if (connectionState === 'connected'
                        || iceConnectionState === 'connected' || iceConnectionState === 'completed') {
                    clearReconnectTimer();
                } else if (connectionState === 'failed' || connectionState === 'disconnected'
                        || iceConnectionState === 'failed' || iceConnectionState === 'disconnected') {
                    scheduleReconnect();
                }
            };

            peerConnection.onconnectionstatechange = reportConnectionState;
            peerConnection.oniceconnectionstatechange = reportConnectionState;

            try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

                if (!isCurrentPeerConnection()) {
                    return;
                }

                const answer = await peerConnection.createAnswer();

                if (!isCurrentPeerConnection()) {
                    return;
                }

                await peerConnection.setLocalDescription(answer);

                if (!isCurrentPeerConnection()) {
                    return;
                }

                while (pendingIceCandidatesRef.current.length && isCurrentPeerConnection()) {
                    const candidate = pendingIceCandidatesRef.current.shift();

                    if (candidate) {
                        try {
                            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                        } catch (error) {
                            logger.warn('Ignoring unusable queued Document PiP renderer ICE candidate:', error);
                        }
                    }
                }

                if (!isCurrentPeerConnection()) {
                    return;
                }

                post('answer', {
                    answer,
                    generation: data.generation
                });
                logger.info('Embedded Document PiP renderer answer created:', { generation });
            } catch (error) {
                if (!isCurrentPeerConnection()) {
                    return;
                }

                logger.error('Embedded Document PiP renderer failed to handle offer:', error);
                post('connection-state', {
                    connectionState: 'failed',
                    error: error instanceof Error ? error.message : String(error),
                    generation: data.generation
                });
                scheduleReconnect();
            }
        }

        const eventListener = ({ data, name }: { data?: any; name: string; }) => {
            switch (name) {
            case 'state':
                setState(data || {});
                break;
            case 'offer':
                handleOffer(data).catch(error => {
                    logger.error('Embedded Document PiP renderer offer operation failed:', error);
                    post('connection-state', {
                        connectionState: 'failed',
                        error: error instanceof Error ? error.message : String(error),
                        generation: data.generation,
                        stage: 'offer'
                    });
                    scheduleReconnect();
                });
                break;
            case 'ice':
                if (data?.generation !== bridgeGenerationRef.current) {
                    break;
                }

                if (peerConnectionRef.current?.remoteDescription) {
                    const peerConnection = peerConnectionRef.current;

                    peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(error => {
                        if (peerConnectionRef.current !== peerConnection) {
                            return;
                        }

                        logger.error('Embedded Document PiP renderer failed to apply ICE candidate:', error);
                    });
                } else {
                    pendingIceCandidatesRef.current.push(data.candidate);
                }
                break;
            }

            return true;
        };

        transport.on('event', eventListener);
        logger.info('Embedded Document PiP renderer ready');
        post('ready');

        return () => {
            offerGenerationRef.current++;
            clearReconnectTimer();
            transport.removeListener('event', eventListener);
            closePeerConnection();
        };
    }, []);

    return (
        <EmbeddedPiPView
            hasPlayableVideo = { hasPlayableVideo }
            onAudioClick = { onAudioClick }
            onHangupClick = { onHangupClick }
            onVideoClick = { onVideoClick }
            onVideoLoadedData = { onVideoLoadedData }
            onVideoPlaying = { onVideoPlaying }
            state = { state }
            videoRef = { videoRef } />
    );
}

const root = createRoot(document.getElementById('react') as HTMLElement);

root.render(<DocumentPiPRenderer />);
window.addEventListener('beforeunload', () => {
    root.unmount();
    transport.dispose();
}, { once: true });
