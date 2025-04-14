/**
 * Interface representing a file being uploaded.
 */
export interface IFile {
    error?: string;
    file: File;
    id: string;
    preview: string;
    progress: number;
}
