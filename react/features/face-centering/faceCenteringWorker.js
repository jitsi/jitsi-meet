import * as blazeface from '@tensorflow-models/blazeface';
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';
import * as tf from '@tensorflow/tfjs-core';

import { FACE_BOX_MESSAGE, DETECT_FACE_BOX } from './constants';

/**
 * Indicates whether an init error occured.
 */
let initError = false;

/**
 * The blazeface model.
 */
let model;

/**
 * A flag that indicates whether the tensorflow backend is set or not.
 */
let backendSet = false;

/**
 * Flag for indicating whether an init operation (e.g setting tf backend) is in progress.
 */
let initInProgress = false;

/**
 * Callbacks queue for avoiding overlapping executions of face detection.
 */
const queue = [];

/**
 * Contains the last valid face bounding box (passes threshold validation) which was sent to the main process.
 */
let lastValidFaceBox;

const detect = async message => {
    const { baseUrl, image, isHorizontallyFlipped, threshold } = message.data;

    if (initInProgress || initError) {
        return;
    }

    if (!backendSet) {
        initInProgress = true;
        setWasmPaths(`${baseUrl}libs/`);

        try {
            await tf.setBackend('wasm');
        } catch (err) {
            initError = true;

            return;
        }

        backendSet = true;
        initInProgress = false;
    }

    // load face detection model
    if (!model) {
        try {
            model = await blazeface.load();
        } catch (err) {
            initError = true;

            return;
        }
    }

    tf.engine().startScope();

    const imageTensor = tf.browser.fromPixels(image);
    const detections = await model.estimateFaces(imageTensor, false, isHorizontallyFlipped, false);

    tf.engine().endScope();

    let faceBox;

    if (detections.length) {
        faceBox = {
            // normalize to percentage based
            left: Math.round(Math.min(...detections.map(d => d.topLeft[0])) * 100 / image.width),
            right: Math.round(Math.max(...detections.map(d => d.bottomRight[0])) * 100 / image.width),
            top: Math.round(Math.min(...detections.map(d => d.topLeft[1])) * 100 / image.height),
            bottom: Math.round(Math.max(...detections.map(d => d.bottomRight[1])) * 100 / image.height)
        };

        if (lastValidFaceBox && Math.abs(lastValidFaceBox.left - faceBox.left) < threshold) {
            return;
        }

        lastValidFaceBox = faceBox;

        self.postMessage({
            type: FACE_BOX_MESSAGE,
            value: faceBox
        });
    }
};

onmessage = function(message) {
    if (message.data.id === DETECT_FACE_BOX) {
        queue.push(() => detect(message));
        queue.shift()();
    }
};
