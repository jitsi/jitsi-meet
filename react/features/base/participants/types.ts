export interface Participant {
    avatarURL?: string;
    botType?: string;
    conference?: Object;
    connectionStatus?: string;
    dominantSpeaker?: boolean;
    e2eeSupported?: boolean;
    email?: string;
    features?: {
        'screen-sharing'?: boolean;
    };
    id: string;
    isFakeParticipant?: boolean;
    isJigasi?: boolean;
    isLocalScreenShare?: boolean;
    isReplacing?: number;
    isVirtualScreenshareParticipant?: boolean;
    loadableAvatarUrl?: string;
    loadableAvatarUrlUseCORS?: boolean;
    local?: boolean;
    name?: string;
    pinned?: boolean;
    presence?: string;
    raisedHandTimestamp?: number;
    remoteControlSessionStatus?: boolean;
    role?: string;
    supportsRemoteControl?: boolean;
}

export interface LocalParticipant extends Participant {
    audioOutputDeviceId?: string;
    cameraDeviceId?: string;
    micDeviceId?: string;
    startWithAudioMuted?: boolean;
    startWithVideoMuted?: boolean;
    userSelectedMicDeviceId?: string;
    userSelectedMicDeviceLabel?: string;
}
