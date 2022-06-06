/**
 * Redux action type dispatched in order to add a face landmarks.
 *
 * {
 *      type: ADD_FACE_LANDMARKS,
 *      faceExpression: string,
 *      duration: number,
 *      timestamp: number,
 *      age: number,
 *      gender: number
 * }
 */
export const ADD_FACE_LANDMARKS = 'ADD_FACE_LANDMARKS';

/**
 * Redux action type dispatched in order to add a expression to the face expressions buffer.
 *
 * {
 *      type: ADD_TO_FACE_EXPRESSIONS_BUFFER,
 *      faceExpression: string
 * }
*/
export const ADD_TO_FACE_EXPRESSIONS_BUFFER = 'ADD_TO_FACE_EXPRESSIONS_BUFFER';

/**
 * Redux action type dispatched in order to clear the face expressions buffer in the state.
 *
 * {
 *      type: CLEAR_FACE_EXPRESSIONS_BUFFER
 * }
*/
export const CLEAR_FACE_EXPRESSIONS_BUFFER = 'CLEAR_FACE_EXPRESSIONS_BUFFER';

/**
 * Redux action type dispatched in order to set recognition active in the state.
 *
 * {
 *      type: START_FACE_LANDMARKS_DETECTION
 * }
 */
export const START_FACE_LANDMARKS_DETECTION = 'START_FACE_LANDMARKS_DETECTION';

 /**
  * Redux action type dispatched in order to set recognition inactive in the state.
  *
  * {
  *      type: STOP_FACE_LANDMARKS_DETECTION
  * }
  */
export const STOP_FACE_LANDMARKS_DETECTION = 'STOP_FACE_LANDMARKS_DETECTION';

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

/**
 * Redux action type dispatched in order to update the maximum number of faces detected.
 *
 * {
 *      type: SET_MAX_NO_FACES,
 *      maxNoFaces: number
 * }
 */
export const SET_MAX_NO_FACES = 'SET_MAX_NO_FACES';
