// @flow

/**
 * Redux action type dispatched in order to add a facial expression.
 *
 * {
 *      type: ADD_FACIAL_EXPRESSION,
 *      facialExpression: string,
 *      duration: number
 * }
 */
export const ADD_FACIAL_EXPRESSION = 'ADD_FACIAL_EXPRESSION';

/**
 * Redux action type dispatched in order to toggle the permission of the facial recognition.
 *
 * {
 *      type: SET_FACIAL_RECOGNITION_ALLOWED,
 *      allowed: boolean
 * }
 */
export const SET_FACIAL_RECOGNITION_ALLOWED = 'SET_FACIAL_RECOGNITION_ALLOWED';

/**
 * Redux action type dispatched in order to set the time interval in which
 * the message to the facial expression worker will be sent.
 *
 * {
 *      type: SET_DETECTION_TIME_INTERVAL,
 *      time: number
 * }
 */
export const SET_DETECTION_TIME_INTERVAL = 'SET_DETECTION_TIME_INTERVAL';

/**
 * Redux action type dispatched in order to update the cameraTimeTracker
* with the latest state of the camera and the time of the last update.
 *
 * {
 *      type: SET_DETECTION_TIME_INTERVAL,
 *      muted: boolean,
 *      lastCameraUpdate: number
 * }
 */
export const UPDATE_CAMERA_TIME_TRACKER = 'UPDATE_CAMERA_TIME_TRACKER';

/**
 * Redux action type dispatched in order to set recognition active in the state.
 *
 * {
 *      type: START_FACIAL_RECOGNITION
 * }
 */
export const START_FACIAL_RECOGNITION = 'START_FACIAL_RECOGNITION';

/**
 * Redux action type dispatched in order to set recognition inactive in the state.
 *
 * {
 *      type: STOP_FACIAL_RECOGNITION
 * }
 */
export const STOP_FACIAL_RECOGNITION = 'STOP_FACIAL_RECOGNITION';
