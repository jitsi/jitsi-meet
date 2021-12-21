// @flow

export const FACIAL_EXPRESSION_EMOJIS = {
    happy: '😊',
    neutral: '😐',
    sad: '🙁',
    surprised: '😮',
    angry: '😠',
    fearful: '😨',
    disgusted: '🤢'
};

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
