import 'image-capture';
import './createImageBitmap';
import { AnyAction } from 'redux';

import {
    ADD_FACE_EXPRESSION,
    ADD_TO_FACE_EXPRESSIONS_BUFFER,
    CLEAR_FACE_EXPRESSIONS_BUFFER,
    NEW_FACE_COORDINATES
} from './actionTypes';
import { FaceBox } from './types';

/**
 * Adds a new face expression and its duration.
 *
 * @param  {string} faceExpression - Face expression to be added.
 * @param  {number} duration - Duration in seconds of the face expression.
 * @param  {number} timestamp - Duration in seconds of the face expression.
 * @returns {AnyAction}
 */
export function addFaceExpression(faceExpression: string, duration: number, timestamp: number): AnyAction {
    return {
        type: ADD_FACE_EXPRESSION,
        faceExpression,
        duration,
        timestamp
    };
}

/**
 * Adds a face expression with its timestamp to the face expression buffer.
 *
 * @param {Object} faceExpression - Object containing face expression string and its timestamp.
 * @returns {AnyAction}
 */
export function addToFaceExpressionsBuffer(
        faceExpression: {
            emotion: string;
            timestamp: number;
        }
): AnyAction {
    return {
        type: ADD_TO_FACE_EXPRESSIONS_BUFFER,
        faceExpression
    };
}

/**
 * Clears the face expressions array in the state.
 *
 * @returns {Object}
 */
export function clearFaceExpressionBuffer() {
    return {
        type: CLEAR_FACE_EXPRESSIONS_BUFFER
    };
}

/**
 * Signals that a new face box was obtained for the local participant.
 *
 * @param {FaceBox} faceBox - The face box of the local participant.
 * @returns {AnyAction}
 */
export function newFaceBox(faceBox: FaceBox): AnyAction {
    return {
        type: NEW_FACE_COORDINATES,
        faceBox
    };
}
