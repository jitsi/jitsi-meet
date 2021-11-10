// @flow
import './faceApiPatch';
import * as faceapi from 'face-api.js';

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
let timer;

/**
 * The duration of the set timeout.
 */
let timeoutDuration = -1;

/**
 * Time used for detection interval when facial expressions worker uses webgl backend.
 */
const WEBGL_TIME_INTERVAL = 1000;

/**
 * Time used for detection interval when facial expression worker uses cpu backend.
 */
const CPU_TIME_INTERVAL = 6000;

// eslint-disable-next-line no-unused-vars
const window = {
    screen: {
        width: 1280,
        height: 720
    }

};


onmessage = async function(message) {
    // Receives image data
    if (message.data.id === 'SET_TIMEOUT') {

        if (message.data.imageData === null || message.data.imageData === undefined) {
            return;
        }

        // the models are loaded
        if (!modelsLoaded) {
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

        // The backend is set
        if (!backendSet) {
            const backend = faceapi.tf.getBackend();

            if (backend !== undefined) {
                if (backend === 'webgl') {
                    timeoutDuration = WEBGL_TIME_INTERVAL;
                } else if (backend === 'cpu') {
                    timeoutDuration = CPU_TIME_INTERVAL;
                }
                self.postMessage({
                    type: 'tf-backend',
                    value: backend
                });
                backendSet = true;
            }
        }
        faceapi.tf.engine().endScope();

        let facialExpression;

        if (detections) {
            facialExpression = detections.expressions.asSortedArray()[0].expression;
        }

        if (timeoutDuration === -1) {

            self.postMessage({
                type: 'facial-expression',
                value: facialExpression
            });
        } else {
            timer = setTimeout(() => {
                self.postMessage({
                    type: 'facial-expression',
                    value: facialExpression
                });
            }, timeoutDuration);
        }


    } else if (message.data.id === 'CLEAR_TIMEOUT') {
        // Clear the timeout.
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    }

};
