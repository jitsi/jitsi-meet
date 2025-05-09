export interface IFile {
    file: File;
    id: string;
    preview: string;
    progress: number;
}

export interface IFileMetadata {
    authorParticipantJid: string | undefined;
    contentType: string | undefined;
    fileId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    meetingFqn: string;
    participantsIds: string[];
    sessionId: string;
    timestamp: number;
}
