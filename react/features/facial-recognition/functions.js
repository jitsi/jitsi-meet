import * as faceapi from 'face-api.js';

import { addFacialExpression } from './actions';

/**
 * @param  {HTMLVideoElement} videoInput
 * @param  {HTMLCanvasElement} outputCanvas
 */
export async function detectFacialExpression(dispatch: Function, videoInput: HTMLVideoElement, outputCanvas: HTMLCanvasElement) {
    const { height, width } = videoInput;
    const outputCanvasContext = outputCanvas.getContext('2d');

    outputCanvasContext.drawImage(videoInput, 0, 0, width, height);
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
