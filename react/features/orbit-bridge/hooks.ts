import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../app/types';
import { getLocalParticipant } from '../base/participants/functions';
import { getLocalAudioTrack, getTrackState } from '../base/tracks/functions.any';
import { setVolume } from '../filmstrip/actions.web';

import { configureOrbitBridge, getOrbitBridgeState, subscribeOrbitBridge } from './controller';

export function useOrbitBridgeState() {
    const [snapshot, setSnapshot] = useState(getOrbitBridgeState());

    useEffect(() => {
        const unsubscribe = subscribeOrbitBridge(() => {
            setSnapshot(getOrbitBridgeState());
        });

        return () => unsubscribe();
    }, []);

    return snapshot;
}

export function useOrbitBridgeConfig() {
    const dispatch = useDispatch();
    const room = useSelector((state: IReduxState) => state['features/base/conference'].room || 'default');
    const participant = useSelector(getLocalParticipant);
    const fallbackId = useRef(`user-${Math.random().toString(36).slice(2, 10)}`);
    const userId = participant?.id || fallbackId.current;
    const track = useSelector((state: IReduxState) => getLocalAudioTrack(getTrackState(state)));
    const participantVolumes = useSelector((state: IReduxState) => state['features/filmstrip'].participantsVolume);
    const bridgeConfig = useSelector((state: IReduxState) => state['features/base/config'] as any);
    const wsBaseUrl = bridgeConfig?.orbitBridgeUrl as string | undefined;
    const targetLanguage = bridgeConfig?.orbitBridgeTargetLanguage as string | undefined;

    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        streamRef.current = track?.jitsiTrack?.getOriginalStream?.() ?? null;
    }, [ track ]);

    const getAudioStream = useMemo(() => {
        return () => streamRef.current;
    }, []);

    useEffect(() => {
        configureOrbitBridge({
            meetingId: room,
            userId,
            wsBaseUrl,
            targetLanguage: targetLanguage || 'en',
            getAudioStream,
            setVolume: (participantId, volume) => dispatch(setVolume(participantId, volume)),
            getVolume: (participantId) => participantVolumes[participantId]
        });
    }, [
        dispatch,
        getAudioStream,
        participantVolumes,
        room,
        targetLanguage,
        userId,
        wsBaseUrl
    ]);
}
