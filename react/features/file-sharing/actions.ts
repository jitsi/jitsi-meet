import {
    ADD_FILE,
    DOWNLOAD_FILE,
    REMOVE_FILE,
    UPDATE_FILE_UPLOAD_PROGRESS,
    UPLOAD_FILES
} from './actionTypes';
import { IFileMetadata } from './types';

/**
 * Upload files.
 *
 * @param {File[]} files - The files to upload.
 * @returns {Object}
 */
export function uploadFiles(files: File[]) {
    return {
        type: UPLOAD_FILES,
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
 * Add a file.
 *
 * @param {IFileMetadata} file - The file to add to the state.
 * @returns {Object}
 */
export function addFile(file: IFileMetadata) {
    return {
        type: ADD_FILE,
        file
    };
}

/**
 * Remove a file from the backend.
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
 * @returns {Object}
 */
export function downloadFile(fileId: string) {
    return {
        type: DOWNLOAD_FILE,
        fileId
    };
}
