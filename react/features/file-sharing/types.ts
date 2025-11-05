export interface IFileMetadata {
    authorParticipantId: string;
    authorParticipantJid: string;
    authorParticipantName: string;
    conferenceFullName: string;
    fileId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    isDeleted?: boolean;
    progress?: number;
    timestamp: number;
}
