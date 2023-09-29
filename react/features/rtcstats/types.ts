export type VideoTypeData = {
    ssrc: number;
    videoType: string;
};

export type DominantSpeakerData = {
    dominantSpeakerEndpoint: string;
    previousSpeakers: string[];
};

export type E2ERTTData = {
    remoteEndpointId: string;
    remoteRegion: string;
    rtt: number;
};

export type FaceLandmarksData = {
    duration: number;
    faceLandmarks: string;
    timestamp: number;
};
