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
 * Type of message sent from main thread to worker that contains init information:
 * such as models directory and window screen size.
 */
export const INIT_WORKER = 'INIT_WORKER';

/**
 * Type of message sent from main thread to worker that contain image data and
 * will set a timeout for sending back the expression if detected in the worker.
 */
export const DETECT = 'DETECT';

/**
 * Type of message sent from main thread to worker that will stop the recognition;
 * the worker will clear the timeout and then will send nothing back.
 */
export const STOP_DETECTION = 'STOP_DETECTION';


export const FACE_CENTERING_INTERVAL = 100;

export const FACIAL_EXPRESSION_INTERVAL = 1000;
