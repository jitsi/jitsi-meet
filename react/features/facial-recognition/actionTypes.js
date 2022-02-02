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
