/* eslint-disable */
self.importScripts('face-api-fix.js');
self.importScripts('face-api.min.js');

/**
 * A flag that indicates whether the tensorflow models were loaded or not.
 */
let modelsLoaded = false;
/**
 * A flag that indicates whether the tensorflow backend is set or not.
 */
let backendSet = false;
/**
 * A timer variable for set interval.
 */
var timer;

var window = {
    screen: {
        width: 1280,
        height: 720
    }

};

onmessage = async function(message) {
    //Receives image data and a time period in ms with which will be set an timeout
    if (message.data.id === 'SET_TIMEOUT') {

        if (message.data.imageData === null || message.data.imageData === undefined) {
            return;
        }
        
        //the models are loaded
        if(!modelsLoaded) {
            await faceapi.loadTinyFaceDetectorModel('.');
            await faceapi.loadFaceExpressionModel('.');
            modelsLoaded = true;
        }
        
        faceapi.tf.engine().startScope();
        const tensor = faceapi.tf.browser.fromPixels(message.data.imageData);
        const detections = await faceapi.detectSingleFace(
                tensor,
                new faceapi.TinyFaceDetectorOptions()
        ).withFaceExpressions();
        faceapi.tf.engine().endScope();
        
        // The backend is set
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
        //Clear the timeout.
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    }
    
};
