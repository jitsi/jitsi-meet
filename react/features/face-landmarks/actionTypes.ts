/**
 * Redux action type dispatched in order to add real-time faceLandmarks to timeline.
 *
 * {
 *      type: ADD_FACE_LANDMARKS,
 *      faceLandmarks: FaceLandmarks
 * }
 */
export const ADD_FACE_LANDMARKS = 'ADD_FACE_LANDMARKS';

/**
 * Redux action type dispatched in order to clear the faceLandmarks buffer for webhook in the state.
 *
 * {
 *      type: CLEAR_FACE_LANDMARKS_BUFFER
 * }
*/
export const CLEAR_FACE_LANDMARKS_BUFFER = 'CLEAR_FACE_LANDMARKS_BUFFER';

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
 * Redux action type dispatched in order to signal new face coordinates were obtained for the local participant.
 *
 * {
 *      type: NEW_FACE_COORDINATES,
 *      faceBox: Object({ left, bottom, right, top }),
 *      participantId: string
 * }
 */
 export const NEW_FACE_COORDINATES = 'NEW_FACE_COORDINATES';
