export enum FakeParticipant {
    Jigasi = 'Jigasi',
    LocalScreenShare = 'LocalScreenShare',
    RemoteScreenShare = 'RemoteScreenShare',
    SharedVideo = 'SharedVideo',
    Whiteboard = 'Whiteboard'
}

export interface IParticipant {
    avatarURL?: string;
    botType?: string;
    conference?: Object;
    connectionStatus?: string;
    displayName?: string;
    dominantSpeaker?: boolean;
    e2eeEnabled?: boolean;
    e2eeSupported?: boolean;
    email?: string;
    fakeParticipant?: FakeParticipant;
    features?: {
        'screen-sharing'?: boolean | string;
    };
    getId?: Function;
    id: string;
    isReplaced?: boolean;
    isReplacing?: number;
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

export interface ILocalParticipant extends IParticipant {
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
