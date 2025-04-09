import { IReduxState } from '../app/types';
import {
    IconImage,
    IconShareDoc,
    IconVideo,
    IconVolumeUp
} from '../base/icons/svg';
import { getLocalizedDateFormatter } from '../base/i18n/dateUtil';

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
