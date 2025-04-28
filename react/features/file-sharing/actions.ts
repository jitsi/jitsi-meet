import { IFile } from './types';
import {
    ADD_FILES,
    REMOVE_FILE,
    UPDATE_FILE_UPLOAD_PROGRESS,
    DOWNLOAD_FILE
} from './actionTypes';

/**
 * Add files.
 *
 * @param {IFile[]} files - The files to add.
 * @returns {Object}
 */
export function addFiles(files: IFile[]) {
    return {
        type: ADD_FILES,
        files
    };
}

/**
 * Update a file's upload progress.
 *
 * @param {string} fileId - The ID of the file to update.
 * @param {number} progress - The new progress value.
 * @returns {Object}
 */
export function updateFileProgress(fileId: string, progress: number) {
    return {
        type: UPDATE_FILE_UPLOAD_PROGRESS,
        fileId,
        progress
    };
}

/**
 * Remove a file.
 *
 * @param {string} fileId - The ID of the file to remove.
 * @returns {Object}
 */
export function removeFile(fileId: string) {
    return {
        type: REMOVE_FILE,
        fileId
    };
}

/**
 * Download a file.
 *
 * @param {string} fileId - The ID of the file to download.
 * @param {string} fileName - The name of the file to download.
 * @param {string} fileHash - The MD5 hash of the file.
 * @returns {Object}
 */
export function downloadFile(fileId: string, fileName: string, fileHash: string) {
    return {
        type: DOWNLOAD_FILE,
        fileId,
        fileName,
        fileHash
    };
}
