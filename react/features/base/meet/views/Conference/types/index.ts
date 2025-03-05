export type VideoParticipantType = {
    id: string;
    name: string;
    videoEnabled: boolean;
    audioMuted: boolean;
    videoTrack: any;
    local: boolean;
    hidden: boolean;
    dominantSpeaker: boolean;
    raisedHand: boolean;
    avatarSource?: string;
};
