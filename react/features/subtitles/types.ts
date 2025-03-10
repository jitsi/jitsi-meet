import { IGroupableMessage } from '../base/util/messageGrouping';

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

export interface ISubtitle extends IGroupableMessage {
    id: string;
    interim?: boolean;
    language?: string;
    participantId: string;
    text: string;
    timestamp: number;
}
