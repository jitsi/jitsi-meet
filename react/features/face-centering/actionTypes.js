/**
 * Redux action type dispatched in order to set the time interval in which
 * the message to the face centering worker will be sent.
 *
 * {
 *      type: SET_DETECTION_TIME_INTERVAL,
 *      time: number
 * }
 */
export const SET_DETECTION_TIME_INTERVAL = 'SET_DETECTION_TIME_INTERVAL';

/**
 * Redux action type dispatched in order to set recognition active in the state.
 *
 * {
 *      type: START_FACE_RECOGNITION
 * }
 */
export const START_FACE_RECOGNITION = 'START_FACE_RECOGNITION';

/**
 * Redux action type dispatched in order to set recognition inactive in the state.
 *
 * {
 *      type: STOP_FACE_RECOGNITION
 * }
 */
export const STOP_FACE_RECOGNITION = 'STOP_FACE_RECOGNITION';

/**
 * Redux action type dispatched in order to update coordinates of a detected face.
 *
 * {
 *      type: UPDATE_FACE_COORDINATES,
 *      faceBox: Object({ left, bottom, right, top }),
 *      participantId: string
 * }
 */
 export const UPDATE_FACE_COORDINATES = 'UPDATE_FACE_COORDINATES';
