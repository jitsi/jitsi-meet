// Types for RTC stats entries.
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
