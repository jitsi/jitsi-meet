export interface IFile {
    file: File;
    id: string;
    preview: string;
    progress: number;
}

export interface IFileMetadata {
    authorParticipantJid: string | undefined;
    contentType: string | undefined;
    md5: string;
    meetingFqn: string;
    participantsIds: string[];
    sessionId: string;
    size: number;
    timestamp: number;
}