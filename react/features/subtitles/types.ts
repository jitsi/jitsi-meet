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
