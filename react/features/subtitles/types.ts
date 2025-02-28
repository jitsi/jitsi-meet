export interface ITranscriptMessage {
    clearTimeOut?: number;
    final?: string;
    participant: {
        avatarUrl?: string;
        id?: string;
        name?: string;
    };
    stable?: string;
    unstable?: string;
}

export interface ISubtitle {
    id: string;
    participant: string;
    text: string;
    timestamp: number;
    interim?: boolean;
    language?: string;
}
