export type InitOptions = {
    endpoint: string;
    meetingFqn: string;
    useLegacy: boolean;
    pollInterval: number;
}

export type VideoTypeData = {
    ssrc: number,
    videoType: string,
}

export type DominantSpeakerData = { 
    dominantSpeakerEndpoint: string,
    previousSpeakers: string[]
}

export type E2ERTTData = {
    remoteEndpointId: string,
    rtt: number,
    remoteRegion: string
}

export type FaceLandmarksData = {
    duration: number,
    faceLandmarks: string,
    timestamp: number
}