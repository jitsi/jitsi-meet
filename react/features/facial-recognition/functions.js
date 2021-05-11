import * as faceapi from 'face-api.js';


export async function detectFacialExpression(videoInput: HTMLVideoElement, outputCanvas: HTMLCanvasElement) {
    const { height, width } = videoInput;
    const outputCanvasContext = outputCanvas.getContext('2d');

    outputCanvasContext.drawImage(videoInput, 0, 0, width, height);
    const detections = await faceapi.detectSingleFace(
        outputCanvas,
        new faceapi.TinyFaceDetectorOptions()
    ).withFaceExpressions();

    // $FlowFixMe - Flow does not (yet) support method calls in optional chains.
    console.log('!!!', detections?.expressions.asSortedArray()[0].expression);
}
