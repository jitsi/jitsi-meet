/**
 * Type of message sent from main thread to worker that contain image data and
 * will trigger a response message from the worker containing the detected face(s) bounding box if any.
 */
export const DETECT_FACE_BOX = 'DETECT_FACE_BOX';

/**
 * Type of event sent on the data channel.
 */
export const FACE_BOX_EVENT_TYPE = 'face-box';

/**
 * Type of message sent from the worker to main thread that contains a face box or undefined.
 */
export const FACE_BOX_MESSAGE = 'face-box';

/**
 * Miliseconds interval value for sending new image data to the worker.
 */
export const SEND_IMAGE_INTERVAL_MS = 100;
