export interface IFileMetadata {
    authorParticipantId: string;
    authorParticipantJid: string;
    authorParticipantName: string;
    conferenceFullName: string;
    fileId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    progress?: number;
    timestamp: number;
}
