// @flow
import './faceApiPatch';
import * as faceapi from '@vladmandic/face-api';

import {
    CLEAR_TIMEOUT,
    CPU_TIME_INTERVAL,
    FACIAL_EXPRESSION_MESSAGE,
    INIT_WORKER,
    SET_TIMEOUT,
    INTERVAL_MESSAGE,
    WEBGL_TIME_INTERVAL
} from './constants';

/**
 * A flag that indicates whether the tensorflow models were loaded or not.
 */
let modelsLoaded = false;

/**
 * The url where the models for the facial detection of expressions are located.
 */
let modelsURL;

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
 * A patch for having window object in the worker.
 */
const window = {
    screen: {
        width: 1280,
        height: 720
    }
};

onmessage = async function(message) {
    switch (message.data.type) {
    case INIT_WORKER : {
        modelsURL = message.data.url;
        if (message.data.windowScreenSize) {
            window.screen = message.data.windowScreenSize;
        }
        break;
    }

    case SET_TIMEOUT : {
        if (!message.data.imageData || !modelsURL) {
            self.postMessage({
                type: FACIAL_EXPRESSION_MESSAGE,
                value: null
            });
        }

        // the models are loaded
        if (!modelsLoaded) {
            await faceapi.loadTinyFaceDetectorModel(modelsURL);
            await faceapi.loadFaceExpressionModel(modelsURL);
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

            if (backend) {
                if (backend === 'webgl') {
                    timeoutDuration = WEBGL_TIME_INTERVAL;
                } else if (backend === 'cpu') {
                    timeoutDuration = CPU_TIME_INTERVAL;
                }
                self.postMessage({
                    type: INTERVAL_MESSAGE,
                    value: timeoutDuration
                });
                backendSet = true;
            }
        }
        faceapi.tf.engine().endScope();
        let facialExpression;

        if (detections) {
            facialExpression = detections.expressions.asSortedArray()[0].expression;
        }
        timer = setTimeout(() => {
            self.postMessage({
                type: FACIAL_EXPRESSION_MESSAGE,
                value: facialExpression
            });
        }, timeoutDuration);
        break;
    }

    case CLEAR_TIMEOUT: {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        break;
    }
    }
};
