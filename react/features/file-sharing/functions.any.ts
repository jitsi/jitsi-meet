import md5 from 'js-md5';
import { IReduxState } from '../app/types';
import { IconShareDoc, IconVideo, IconVolumeUp } from '../base/icons/svg';

import { API_BASE_URL } from './constants';

/**
 * Reads a chunk of file as ArrayBuffer.
 *
 * @param {Blob} chunk - The chunk of file data to read.
 * @returns {Promise<ArrayBuffer>}
 * @throws {Error}
 */
export function readChunkAsArrayBuffer(chunk: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = e => {
            if (!e.target?.result) {
                reject(new Error('Failed to read chunk: No result available'));

                return;
            }

            resolve(e.target.result as ArrayBuffer);
        };

        reader.onerror = e => reject(new Error(`Failed to read chunk: ${e.target?.error?.message || 'Unknown error'}`));

        reader.readAsArrayBuffer(chunk);
    });
}

/**
 * Calculates MD5 hash of a file by reading it in chunks.
 *
 * @param {File} file - The file to calculate hash for.
 * @param {Function} [progressCallback] - Optional callback for progress updates.
 * @returns {Promise<string>}
 */
export async function calculateFileHash(file: File, progressCallback?: (progress: number) => void): Promise<string> {
    const chunkSize = 2 * 1024 * 1024; // 2MB chunks
    const chunks = Math.ceil(file.size / chunkSize);
    const hashObj = md5.create();

    for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = await readChunkAsArrayBuffer(file.slice(start, end));

        hashObj.update(new Uint8Array(chunk));

        if (progressCallback) {
            progressCallback((i + 1) / chunks * 100);
        }
    }

    return hashObj.hex();
}

/**
 * Makes an API call to the file sharing server.
 *
 * @param {Object} options - The options for the API call.
 * @param {string} options.method - The HTTP method to use.
 * @param {string} options.endpoint - The API endpoint.
 * @param {Object} options.headers - The request headers.
 * @param {Object} [options.body] - The request body.
 * @returns {Promise<any>}
 * @throws {Error}
 */
export async function makeApiCall({
    body,
    endpoint,
    headers,
    method
}: {
    body?: FormData | undefined;
    endpoint: string;
    headers: Record<string, string>;
    method: string;
}): Promise<any> {
    let responseError;

    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method,
                headers,
                ...(body && { body })
            });

            if (!response.ok) {
                const errorText = await response.text();

                responseError = new Error(`${method} request failed with status: ${response.status}. Error: ${errorText}`);

                if (response.status >= 500 && attempt === 0) {
                    continue;
                }

                throw responseError;
            }

            try {
                return await response.json();
            } catch {
                return undefined;
            }
        } catch (error) {
            responseError = error;

            if (attempt === 1) {
                throw responseError;
            }
        }
    }

    throw responseError;
}

/**
 * Checks whether file sharing feature is enabled.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} - Indicates if file sharing feature is enabled.
 */
export function isFileSharingEnabled(state: IReduxState) {
    const { fileSharingEnabled = true } = state['features/base/config'];

    return fileSharingEnabled;
}

/**
 * Creates a preview URL for a image files.
 *
 * @param {File} file - The file to create a preview for.
 * @returns {Promise<string>} A promise that resolves to the preview URL or empty string.
 */
export function createFilePreview(file: File): Promise<string> {
    if (!file.type.startsWith('image/')) {
        return Promise.resolve('');
    }

    return new Promise(resolve => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result as string || '');
        reader.readAsDataURL(file);
    });
}

/**
 * Gets the appropriate icon for a file based on its type.
 *
 * @param {File} file - The file.
 * @returns {Function} The icon component to use.
 */
export function getFileIcon(file: File) {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if ([ 'mp4', 'mov', 'avi', 'webm' ].includes(extension || '')) {
        return IconVideo;
    }

    if ([ 'mp3', 'wav', 'ogg' ].includes(extension || '')) {
        return IconVolumeUp;
    }

    return IconShareDoc;
}
