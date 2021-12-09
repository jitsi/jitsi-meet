/**
 * Types of messages that are passed between the main thread and the WebWorker
 * ({@code flacEncodeWorker}).
 */

// Messages sent by the main thread

/**
 * Message type that signals the termination of encoding,
 * after which no new audio bits should be sent to the
 * WebWorker.
 */
export const MAIN_THREAD_FINISH = 'MAIN_THREAD_FINISH';

/**
 * Message type that carries initial parameters for
 * the WebWorker.
 */
export const MAIN_THREAD_INIT = 'MAIN_THREAD_INIT';

/**
 * Message type that carries the newly received raw audio bits
 * for the WebWorker to encode.
 */
export const MAIN_THREAD_NEW_DATA_ARRIVED = 'MAIN_THREAD_NEW_DATA_ARRIVED';

// Messages sent by the WebWorker

/**
 * Message type that signals libflac is ready to receive audio bits.
 */
export const WORKER_LIBFLAC_READY = 'WORKER_LIBFLAC_READY';

/**
 * Message type that carries the encoded FLAC file as a Blob.
 */
export const WORKER_BLOB_READY = 'WORKER_BLOB_READY';

// Messages sent by either the main thread or the WebWorker

/**
 * Debug messages.
 */
export const DEBUG = 'DEBUG';
