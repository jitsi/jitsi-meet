export const FACE_EXPRESSIONS_EMOJIS = {
    happy: '😊',
    neutral: '😐',
    sad: '🙁',
    surprised: '😮',
    angry: '😠',
    fearful: '😨'

    // disgusted: '🤢'
};

export const FACE_EXPRESSIONS = [ 'happy', 'neutral', 'sad', 'surprised', 'angry', 'fearful' ];

export const FACE_EXPRESSIONS_NAMING_MAPPING = {
    happy: 'happy',
    neutral: 'neutral',
    surprise: 'surprised',
    angry: 'angry',
    fear: 'fearful',
    disgust: 'disgusted',
    sad: 'sad'
};

/**
 * Time is ms used for sending expression.
 */
export const WEBHOOK_SEND_TIME_INTERVAL = 15000;

/**
 * Time is ms used for checking raised hand duration.
 */
export const RAISED_HAND_DURATION = 2000;

/**
 * Type of message sent from main thread to worker that contains init information:
 * such as models directory and window screen size.
 */
export const INIT_WORKER = 'INIT_WORKER';

/**
 * Type of event sent on the data channel.
 */
export const FACE_BOX_EVENT_TYPE = 'face-box';

/**
 * Type of event sent on the data channel.
 */
export const FACE_LANDMARKS_EVENT_TYPE = 'face-landmarks';

/**
 * Milliseconds interval value for sending new image data to the worker.
 */
export const SEND_IMAGE_INTERVAL_MS = 1000;

/**
 * Type of message sent from main thread to worker that contain image data and
 * will trigger a response message from the worker containing the detected info.
 */
export const DETECT = 'DETECT';

/**
 * Available detection types.
 */
export const DETECTION_TYPES = {
    FACE_BOX: 'face-box',
    FACE_EXPRESSIONS: 'face-expressions',
    RAISED_HAND: 'raised-hand'
};

/**
 * Threshold for detection score of face.
 */
export const FACE_DETECTION_SCORE_THRESHOLD = 0.75;

/**
 * Threshold for detection score of hand.
 */
export const HAND_DETECTION_SCORE_THRESHOLD = 0.8;

/**
 * Threshold for stopping detection after a certain number of consecutive errors have occurred.
 */
export const FACE_LANDMARKS_DETECTION_ERROR_THRESHOLD = 4;

/**
 * Threshold for number of consecutive detections with no face,
 * so that when achieved there will be dispatched an action.
 */
export const NO_FACE_DETECTION_THRESHOLD = 5;

/**
 * Constant type used for signaling that no valid face detection is found.
 */
export const NO_DETECTION = 'no-detection';
