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

/**
 * Redux action type dispatched in order to clear the facial expressions buffer in the state.
 *
 * {
 *      type: CLEAR_FACIAL_EXPRESSIONS_BUFFER
 * }
*/
export const CLEAR_FACIAL_EXPRESSIONS_BUFFER = 'CLEAR_FACIAL_EXPRESSIONS_BUFFER';

/**
 * Redux action type dispatched in order to add a expression to the facial expressions buffer.
 *
 * {
 *      type: ADD_TO_FACIAL_EXPRESSIONS_BUFFER 
 * }
*/
export const ADD_TO_FACIAL_EXPRESSIONS_BUFFER = 'ADD_TO_FACIAL_EXPRESSIONS_BUFFER ';

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
