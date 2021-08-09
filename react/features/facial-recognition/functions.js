// @flow
import * as faceapi from 'face-api.js';

import { addFacialExpression } from './actions';

/**
 * Detects the facial expression.
 *
 * @param  {Function} dispatch - Function for dispatching actions.
 * @param  {ImageCapture} imageCapture - Object containing the video track.
 * @param  {HTMLCanvasElement} outputCanvas - Canvas with the frame.
 * @returns {void}
 */
export async function detectFacialExpression(
        dispatch: Function,
        imageCapture: ImageCapture,
        outputCanvas: HTMLCanvasElement
) {
    // const { height, width } = videoInput;
    const outputCanvasContext = outputCanvas.getContext('2d');
    let imageBitmap;

    try {
        imageBitmap = await imageCapture.grabFrame();
    } catch (err) {
        return;
    }

    outputCanvasContext.drawImage(imageBitmap, 0, 0, imageBitmap.width, imageBitmap.height);
    const detections = await faceapi.detectSingleFace(
        outputCanvas,
        new faceapi.TinyFaceDetectorOptions()
    ).withFaceExpressions();

    // $FlowFixMe - Flow does not (yet) support method calls in optional chains.
    const facialExpression = detections?.expressions.asSortedArray()[0].expression;

    console.log('!!!', facialExpression);

    if (facialExpression !== undefined) {
        dispatch(addFacialExpression(facialExpression));
    }

}
