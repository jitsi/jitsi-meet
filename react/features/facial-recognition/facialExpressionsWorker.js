// @flow
import './faceApiPatch';
import * as faceapi from '@vladmandic/face-api';

import {
    DETECT,
    INIT_WORKER,
    STOP_DETECTION,
    FACE_CENTERING_INTERVAL,
    FACIAL_EXPRESSION_INTERVAL
} from './constants';


/**
 * A flag that indicates whether the tensorflow models were loaded or not.
 */
let workerReady = false;

/**
 * A timer variable for set interval.
 */
let timer;

let enableFaceBox;

let enableFacialExpressions;

let detectionCycleCount = 0;

let lastValidFaceBox;

const initWorker = async ({ url, faceBox, facialExpressions }) => {
    if (workerReady) {
        return;
    }

    enableFaceBox = faceBox;
    enableFacialExpressions = facialExpressions;
    faceapi.tf.setWasmPaths(url);
    await faceapi.tf.setBackend('wasm');
    await faceapi.loadTinyFaceDetectorModel(url);
    await faceapi.loadFaceExpressionModel(url);

    workerReady = true;
};

const sendMessage = (time, faceBox, facialExpression) => {
    timer = setTimeout(() => {
        self.postMessage({
            faceBox,
            facialExpression
        });
    }, time);
};

// eslint-disable-next-line max-params
const detect = async (image, withFaceBox, withFacialExpressions, time, threshold) => {
    if (!workerReady || !image || (!withFaceBox && !withFacialExpressions)) {
        sendMessage(time, null, null);

        return;
    }

    faceapi.tf.engine().startScope();

    const tensor = faceapi.tf.browser.fromPixels(image);
    const detectPromise = faceapi.detectAllFaces(tensor, new faceapi.TinyFaceDetectorOptions());
    const detections = withFacialExpressions ? await detectPromise.withFaceExpressions() : await detectPromise;

    faceapi.tf.engine().endScope();
    let faceBox = null;
    let facialExpression = null;

    if (!detections.length) {
        sendMessage(time, null, null);

        return;
    }

    facialExpression = withFacialExpressions ? detections[0].expressions.asSortedArray()[0].expression : null;
    if (withFaceBox) {
        const finalDetections = withFacialExpressions ? detections.map(d => d.detection) : detections;

        faceBox = {
            // normalize to percentage based
            left: Math.round(Math.min(...finalDetections.map(d => d.relativeBox.left)) * 100),
            right: Math.round(Math.max(...finalDetections.map(d => d.relativeBox.right)) * 100),
            top: Math.round(Math.min(...finalDetections.map(d => d.relativeBox.top)) * 100),
            bottom: Math.round(Math.max(...finalDetections.map(d => d.relativeBox.bottom)) * 100)
        };
    }

    if (lastValidFaceBox && Math.abs(lastValidFaceBox.left - faceBox.left) < threshold) {
        sendMessage(time, null, null);

        return;
    }


    sendMessage(time, faceBox, facialExpression);
};

onmessage = async function(message) {
    const { type } = message.data;

    switch (type) {
    case INIT_WORKER : {

        await initWorker(message.data);
        break;
    }
    case DETECT : {
        const { image } = message.data;
        let withFacialExpressions = false;

        if (enableFaceBox && enableFacialExpressions) {
            if (++detectionCycleCount === FACIAL_EXPRESSION_INTERVAL / FACE_CENTERING_INTERVAL) {
                withFacialExpressions = true;
                detectionCycleCount = 0;
            }
            await detect(image, true, withFacialExpressions, FACE_CENTERING_INTERVAL);
        } else if (enableFaceBox) {
            await detect(image, true, false);
        } else if (enableFacialExpressions) {
            await detect(image, false, true, FACIAL_EXPRESSION_INTERVAL);
        } else {
            return;
        }
        break;
    }
    case STOP_DETECTION : {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        break;
    }
    }
};
