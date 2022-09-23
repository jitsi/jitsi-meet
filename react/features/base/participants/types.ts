export interface Participant {
    avatarURL?: string;
    botType?: string;
    conference?: Object;
    connectionStatus?: string;
    displayName?: string;
    dominantSpeaker?: boolean;
    e2eeEnabled?: boolean;
    e2eeSupported?: boolean;
    email?: string;
    features?: {
        'screen-sharing'?: boolean | string;
    };
    getId?: Function;
    id: string;
    isFakeParticipant?: boolean;
    isJigasi?: boolean;
    isLocalScreenShare?: boolean;
    isReplaced?: boolean;
    isReplacing?: number;
    isVirtualScreenshareParticipant?: boolean;
    jwtId?: string;
    loadableAvatarUrl?: string;
    loadableAvatarUrlUseCORS?: boolean;
    local?: boolean;
    localRecording?: string;
    name?: string;
    pinned?: boolean;
    presence?: string;
    raisedHandTimestamp?: number;
    region?: string;
    remoteControlSessionStatus?: boolean;
    role?: string;
    supportsRemoteControl?: boolean;
}

export interface LocalParticipant extends Participant {
    audioOutputDeviceId?: string;
    cameraDeviceId?: string;
    jwtId?: string;
    micDeviceId?: string;
    startWithAudioMuted?: boolean;
    startWithVideoMuted?: boolean;
    userSelectedMicDeviceId?: string;
    userSelectedMicDeviceLabel?: string;
}

export interface IJitsiParticipant {
    getId: () => string;
}
