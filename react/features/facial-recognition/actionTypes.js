// @flow

/**
 * Redux action type dispatched in order to add a facial expression.
 *
 * {
 *      type: ADD_FACIAL_EXPRESSION
 * }
 */

export const ADD_FACIAL_EXPRESSION = 'ADD_FACIAL_EXPRESSION';

/**
 * Redux action type dispatched in order to toggle the permission of the facial recognition.
 *
 * {
 *      type: SET_FACIAL_RECOGNITION_ALLOWED
 * }
 */

export const SET_FACIAL_RECOGNITION_ALLOWED = 'SET_FACIAL_RECOGNITION_ALLOWED';

/**
 * Redux action type dispatched in order to set the time interval in which
 * the message to the facial expression worker will be sent.
 *
 * {
 *      type: SET_DETECTION_TIME_INTERVAL
 * }
 */

export const SET_DETECTION_TIME_INTERVAL = 'SET_DETECTION_TIME_INTERVAL';

/**
 * Redux action type dispatched in order to update the cameraTimeTracker
* with the latest state of the camera and the time of the last update.
 *
 * {
 *      type: SET_DETECTION_TIME_INTERVAL
 * }
 */

export const UPDATE_CAMERA_TIME_TRACKER = 'UPDATE_CAMERA_TIME_TRACKER';
