/* eslint-disable */
self.importScripts('fix.js');
self.importScripts('face-api.js');

let modelsLoaded = false;

// eslint-disable-next-line vars-on-top
var window = {
    screen: {
        width: 1280,
        height: 720
    }

};

onmessage = async function(imageBitmap) {
    if(!modelsLoaded) {
        await faceapi.loadTinyFaceDetectorModel('.');
        await faceapi.loadFaceExpressionModel('.');
        modelsLoaded = true;
        console.log('LOADED');
    }

    const canvas = new Canvas(imageBitmap.data.width, imageBitmap.data.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(imageBitmap.data, 0, 0);
    const detections = await faceapi.detectSingleFace(
            canvas,
            new faceapi.TinyFaceDetectorOptions()
    ).withFaceExpressions();

    if (detections) {
        let correctExpression = {
            expression: null,
            probability: 0.0
        };

        for (let e of detections.expressions) {
            if (e.probability > correctExpression.probability) {
                correctExpression = e;
            }
        }
        postMessage(correctExpression.expression);
    }
};
