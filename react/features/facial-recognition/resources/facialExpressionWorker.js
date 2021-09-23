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
var timer;

onmessage = async function(message) {
    if (message.data.id === 'SET_TIMEOUT') {

        if (message.data.imageData === null || message.data.imageData === undefined) {
            return;
        }
        
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

        let facialExpression;

        if (detections) {
            facialExpression = detections.expressions.asSortedArray()[0].expression;
        }

        if (message.data.time === -1) {
                postMessage({
                    type: 'facial-expression',
                    value: facialExpression
                });
                return;
        }
        timer = setTimeout(() =>{
            postMessage({
                type: 'facial-expression',
                value: facialExpression
            });
        }, message.data.time)

    } else if (message.data.id === 'CLEAR_TIMEOUT') {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    }
    
};
