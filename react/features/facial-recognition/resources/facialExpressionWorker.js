/* eslint-disable */
self.importScripts('face-api-fix.js');
self.importScripts('face-api.min.js');

let modelsLoaded = false;

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
        console.log('LOADED');
    }
    
    const imageData = new ImageData(message.data.imageData.data, message.data.imageData.width);
    const tensor = faceapi.tf.browser.fromPixels(imageData);
    const detections = await faceapi.detectSingleFace(
            tensor,
            new faceapi.TinyFaceDetectorOptions()
    ).withFaceExpressions();

    if (detections) {
        const facialExpression = detections.expressions.asSortedArray()[0].expression;
        postMessage(facialExpression);
    }
};