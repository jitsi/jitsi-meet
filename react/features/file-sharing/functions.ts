import md5 from 'js-md5';

/**
 * Reads a chunk of file as ArrayBuffer.
 *
 * @param {Blob} chunk - The chunk to read.
 * @returns {Promise<ArrayBuffer>} - Promise resolving to ArrayBuffer.
 */
export function readChunkAsArrayBuffer(chunk: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = e => resolve(e.target?.result as ArrayBuffer);
        reader.onerror = e => reject(e);
        reader.readAsArrayBuffer(chunk);
    });
}

/**
 * Calculates MD5 hash of a file by reading it in chunks.
 *
 * @param {File} file - The file to calculate hash for.
 * @param {Function} [progressCallback] - Optional callback for progress updates.
 * @returns {Promise<string>} - Promise resolving to MD5 hash string.
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
