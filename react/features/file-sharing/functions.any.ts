import md5 from 'js-md5';
import { IReduxState } from '../app/types';
import { isLocalParticipantModerator } from '../base/participants/functions';

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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers,
        ...(body && { body })
    });

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(`${method} request failed with status: ${response.status}. Error: ${errorText}`);
    }

    try {
        return await response.json();
    } catch {
        // If the response is empty or not JSON, return undefined
        return undefined;
    }
}

/**
 * Checks whether file sharing feature is enabled.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} - Indicates if file sharing feature is enabled.
 */
export function isFileSharingEnabled(state: IReduxState) {
    const { fileSharingEnabled = true } = state['features/base/config'];
    const isModerator = isLocalParticipantModerator(state);

    return fileSharingEnabled && isModerator;
}
