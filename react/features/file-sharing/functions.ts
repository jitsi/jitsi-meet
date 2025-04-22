import md5 from 'js-md5';
import { IFileMetadata } from './types';
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
 * Checks if a file with the given hash already exists.
 *
 * @param {string} fileHash - The hash of the file.
 * @param {string} meetingFqn - The meeting FQN.
 * @param {Object} headers - Request headers.
 * @returns {Promise<IFileMetadata | null>}
 */
export async function isFileAlreadyUploaded(
        fileHash: string,
        meetingFqn: string,
        headers: Record<string, string>
): Promise<IFileMetadata | null> {
    const response = await fetch(
        `${API_BASE_URL}/documents?md5=${fileHash}&meetingFqn=${meetingFqn}`,
        { headers }
    );

    if (!response.ok) {
        return null;
    }

    const existingFiles = await response.json();

    return existingFiles?.length > 0 ? existingFiles[0] : null;
}

/**
 * Uploads a file to the server.
 *
 * @param {File} file - The file to upload.
 * @param {IFileMetadata} metadata - The file metadata.
 * @param {Object} headers - Request headers.
 * @returns {Promise<IFileMetadata>}
 */
export async function uploadFileToServer(
        file: File,
        metadata: IFileMetadata,
        headers: Record<string, string>
): Promise<IFileMetadata> {
    const formData = new FormData();

    formData.append('metadata', JSON.stringify(metadata));
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers,
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(`Upload failed with status: ${response.status}. Error: ${errorText}`);
    }

    return response.json();
}
