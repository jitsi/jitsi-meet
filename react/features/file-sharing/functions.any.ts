import { IReduxState, IStore } from '../app/types';
import { getLocalizedDateFormatter } from '../base/i18n/dateUtil';
import {
    IconImage,
    IconShareDoc,
    IconVideo,
    IconVolumeUp
} from '../base/icons/svg';
import { MEET_FEATURES } from '../base/jwt/constants';
import { isJwtFeatureEnabled } from '../base/jwt/functions';
import { showErrorNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../notifications/constants';
import { iAmVisitor } from '../visitors/functions';

import { uploadFiles } from './actions';
import { MAX_FILE_SIZE } from './constants';

/**
 * Checks whether file sharing feature is enabled.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} - Indicates if file sharing feature is enabled.
 */
export function isFileSharingEnabled(state: IReduxState) {
    const { fileSharing } = state['features/base/config'] ?? {};

    return Boolean(fileSharing?.enabled && fileSharing?.apiUrl);
}

/**
 * Gets the file extension from a file name.
 *
 * @param {string} fileName - The name of the file to extract the extension from.
 * @returns {string} The file extension or an empty string if none exists.
 */
export function getFileExtension(fileName: string): string {
    const parts = fileName.split('.');

    if (parts.length > 1) {
        return parts.pop()?.toLowerCase() || '';
    }

    return '';
}

/**
 * Gets the appropriate icon for a file based on its type.
 *
 * @param {string} fileType - The file type.
 * @returns {Function} The icon component to use.
 */
export function getFileIcon(fileType: string) {
    if ([ 'mkv', 'mp4', 'mov', 'avi', 'webm' ].includes(fileType)) {
        return IconVideo;
    }

    if ([ 'mp3', 'wav', 'ogg' ].includes(fileType)) {
        return IconVolumeUp;
    }

    if ([ 'jpg', 'jpeg', 'png', 'gif' ].includes(fileType)) {
        return IconImage;
    }

    return IconShareDoc;
}

/**
 * Formats the file size into a human-readable string.
 *
 * @param {number} bytes - The size in bytes.
 * @returns {string} The formatted file size string.
 */
export function formatFileSize(bytes: number): string {
    if (bytes <= 0) {
        return '0 Bytes';
    }

    const sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB', 'PB' ];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);

    // Check if size is an integer after rounding to 2 decimals
    const rounded = Math.round(size * 100) / 100;
    const formattedSize = Number.isInteger(rounded) ? rounded : rounded.toFixed(2);

    return `${formattedSize} ${sizes[i]}`;
}

/**
 * Formats the timestamp into a human-readable string.
 *
 * @param {number} timestamp - The timestamp to format.
 * @returns {string} The formatted timestamp string.
 */
export function formatTimestamp(timestamp: number): string {
    const date = getLocalizedDateFormatter(timestamp);
    const monthDay = date.format('MMM D'); // Eg. "May 15"
    const time = date.format('h:mm A'); // Eg. "2:30 PM"

    return `${monthDay}\n${time}`;
}

/**
 * Processes a list of files for upload.
 *
 * @param {FileList|File[]} fileList - The list of files to process.
 * @param {Dispatch} dispatch - The Redux dispatch function.
 * @returns {void}
 */
// @ts-ignore
export const processFiles = (fileList: FileList | File[], store: IStore) => {
    const state = store.getState();
    const dispatch = store.dispatch;

    const { maxFileSize = MAX_FILE_SIZE } = state['features/base/config']?.fileSharing ?? {};

    const newFiles = Array.from(fileList as File[]).filter((file: File) => {

        // No file size limitation
        if (maxFileSize === -1) {
            return true;
        }

        // Check file size before upload
        if (file.size > maxFileSize) {
            dispatch(showErrorNotification({
                titleKey: 'fileSharing.fileTooLargeTitle',
                descriptionKey: 'fileSharing.fileTooLargeDescription',
                descriptionArguments: {
                    maxFileSize: formatFileSize(maxFileSize)
                },
                appearance: NOTIFICATION_TYPE.ERROR
            }, NOTIFICATION_TIMEOUT_TYPE.STICKY));

            return false;
        }

        return true;
    });

    if (newFiles.length > 0) {
        dispatch(uploadFiles(newFiles as File[]));
    }
};

/**
 * Determines if file uploading is enabled based on JWT feature flags and file sharing settings.
 *
 * @param {IReduxState} state - Current state.
 * @returns {boolean} Indication of whether local user can upload files.
 */
export function isFileUploadingEnabled(state: IReduxState): boolean {
    return !iAmVisitor(state)
        && isJwtFeatureEnabled(state, MEET_FEATURES.FILE_UPLOAD, false)
        && isFileSharingEnabled(state);
}
