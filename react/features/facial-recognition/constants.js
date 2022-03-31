// @flow

export const FACIAL_EXPRESSION_EMOJIS = {
    happy: '😊',
    neutral: '😐',
    sad: '🙁',
    surprised: '😮',
    angry: '😠',
    fearful: '😨'

    // disgusted: '🤢'
};

export const FACIAL_EXPRESSIONS = [ 'happy', 'neutral', 'sad', 'surprised', 'angry', 'fearful' ];

/**
 * Time used for detection interval when facial expressions worker uses webgl backend.
 */
export const WEBGL_TIME_INTERVAL = 1000;

/**
 * Time used for detection interval when facial expression worker uses cpu backend.
 */
export const CPU_TIME_INTERVAL = 6000;

/**
 * Time is ms used for sending expression.
 */
export const WEBHOOK_SEND_TIME_INTERVAL = 15000;

/**
 * Type of message sent from main thread to worker that contains init information:
 * such as models directory and window screen size.
 */
export const INIT_WORKER = 'INIT_WORKER';

/**
 * Type of message sent from the worker to main thread that contains a facial expression.
 */
export const FACIAL_EXPRESSION_MESSAGE = 'FACIAL_EXPRESSION_MESSAGE_TYPE';

/**
 * Type of message sent from the worker to main thread that contains a face box.
 */
export const FACE_BOX_MESSAGE = 'FACE_BOX_MESSAGE_TYPE';

/**
 * Type of event sent on the data channel.
 */
export const FACE_BOX_EVENT_TYPE = 'face-box';

/**
 * Miliseconds interval value for sending new image data to the worker.
 */
export const SEND_IMAGE_INTERVAL_MS = 1000;

/**
 * Type of message sent from main thread to worker that contain image data and
 * will trigger a response message from the worker containing the detected face(s) info.
 */
export const DETECT_FACE = 'DETECT_FACE';

/**
 * Available detection types.
 */
export const DETECTION_TYPES = {
    FACE_BOX: 'face-box',
    FACE_EXPRESSIONS: 'face-expressions'
};
