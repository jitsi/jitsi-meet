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
 * Time is ms used for sending expression.
 */
export const WEBHOOK_SEND_TIME_INTERVAL = 15000;

/**
 * Time used for detection interval when facial expressions worker uses webgl backend.
 */
 export const DETECTION_TIME_INTERVAL = 1000;

/**
 * Type of message sent from main thread to worker that contains init information:
 * such as models directory and window screen size.
 */
export const INIT_WORKER = 'INIT_WORKER';

/**
 * Type of message sent from main thread to worker that contain image data and
 * will set a timeout for sending back the expression if detected in the worker.
 */
export const SET_TIMEOUT = 'SET_TIMEOUT';

/**
 * Type of message sent from main thread to worker that will stop the recognition;
 * the worker will clear the timeout and then will send nothing back.
 */
export const CLEAR_TIMEOUT = 'CLEAR_TIMEOUT';

/**
 * Type of message sent from the worker to main thread that contains a facial expression or undefined.
 */
export const FACIAL_EXPRESSION_MESSAGE = 'FACIAL_EXPRESSION_MESSAGE_TYPE';
