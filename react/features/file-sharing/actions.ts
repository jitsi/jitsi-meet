import { IFile } from './types';
import {
    ADD_FILES,
    REMOVE_FILE,
    UPDATE_FILE_UPLOAD_PROGRESS
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
