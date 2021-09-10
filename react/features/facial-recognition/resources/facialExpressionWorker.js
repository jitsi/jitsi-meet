/* eslint-disable */
self.importScripts('face-api-fix.js');
self.importScripts('face-api.min.js');

let modelsLoaded = false;
let backendSet = false;

var window = {
    screen: {
        width: 1280,
        height: 720
    }

};

onmessage = async function(message) {
    if(!modelsLoaded) {
        await faceapi.loadTinyFaceDetectorModel('.');
        await faceapi.loadFaceExpressionModel('.');
        modelsLoaded = true;
    }

    const tensor = faceapi.tf.browser.fromPixels(message.data.imageData);
    const detections = await faceapi.detectSingleFace(
            tensor,
            new faceapi.TinyFaceDetectorOptions()
    ).withFaceExpressions();
    
    if (!backendSet) {
        const backend = faceapi.tf.getBackend();
        if (backend !== undefined) {
            postMessage({
                type: 'tf-backend',
                value: backend,
            })
            backendSet = true;
        }
    }

    if (detections) {
        const facialExpression = detections.expressions.asSortedArray()[0].expression;
        postMessage({ 
            type: 'facial-expression',
            value: facialExpression
        });
    }
};