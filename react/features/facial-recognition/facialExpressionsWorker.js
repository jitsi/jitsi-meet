// @flow
import './faceApiPatch';
import * as faceapi from '@vladmandic/face-api';

import {
    CLEAR_TIMEOUT,
    DETECTION_TIME_INTERVAL,
    FACIAL_EXPRESSION_MESSAGE,
    INIT_WORKER,
    SET_TIMEOUT
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
 * A timer variable for set interval.
 */
let timer;

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
    const { image, type } = message.data;

    switch (type) {
    case INIT_WORKER : {
        modelsURL = message.data.url;
        if (message.data.windowScreenSize) {
            window.screen = message.data.windowScreenSize;
        }
        if (self.useWASM) {
            faceapi.tf.setWasmPaths(modelsURL);
            await faceapi.tf.setBackend('wasm');
        }
        break;
    }
    case SET_TIMEOUT : {
        if (!image || !modelsURL) {
            self.postMessage({
                type: FACIAL_EXPRESSION_MESSAGE,
                value: null
            });
        }
        if (!modelsLoaded) {
            await faceapi.loadTinyFaceDetectorModel(modelsURL);
            await faceapi.loadFaceExpressionModel(modelsURL);
            modelsLoaded = true;
        }
        faceapi.tf.engine().startScope();

        const tensor = faceapi.tf.browser.fromPixels(image);
        const detections = await faceapi.detectSingleFace(
                tensor,
                new faceapi.TinyFaceDetectorOptions()
        ).withFaceExpressions();

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
        }, DETECTION_TIME_INTERVAL);
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
