import './faceApiPatch';

import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';
import * as faceapi from '@vladmandic/face-api';

import { DETECTION_TYPES, DETECT_FACE, INIT_WORKER } from './constants';

/**
 * Detection types to be applied.
 */
let faceDetectionTypes = [];

/**
 * Indicates whether an init error occured.
 */
let initError = false;

/**
 * A flag that indicates whether the models are loaded or not.
 */
let modelsLoaded = false;

/**
 * A flag that indicates whether the tensorflow backend is set or not.
 */
let backendSet = false;

/**
 * Flag for indicating whether a face detection flow is in progress or not.
 */
let detectionInProgress = false;

/**
 * Contains the last valid face bounding box (passes threshold validation) which was sent to the main process.
 */
let lastValidFaceBox;

const detectFaceBox = async ({ detections, threshold }) => {
    if (!detections.length) {
        return null;
    }

    const faceBox = {
        // normalize to percentage based
        left: Math.round(Math.min(...detections.map(d => d.relativeBox.left)) * 100),
        right: Math.round(Math.max(...detections.map(d => d.relativeBox.right)) * 100)
    };

    faceBox.width = Math.round(faceBox.right - faceBox.left);

    if (lastValidFaceBox && Math.abs(lastValidFaceBox.left - faceBox.left) < threshold) {
        return null;
    }

    lastValidFaceBox = faceBox;

    return faceBox;
};

const detectFaceExpression = async ({ detections }) =>
    detections[0]?.expressions.asSortedArray()[0].expression;

const detect = async ({ image, threshold }) => {
    let detections;
    let faceExpression;
    let faceBox;

    detectionInProgress = true;
    faceapi.tf.engine().startScope();

    const imageTensor = faceapi.tf.browser.fromPixels(image);

    if (faceDetectionTypes.includes(DETECTION_TYPES.FACE_EXPRESSIONS)) {
        detections = await faceapi.detectAllFaces(
            imageTensor,
            new faceapi.TinyFaceDetectorOptions()
        ).withFaceExpressions();

        faceExpression = await detectFaceExpression({ detections });
    }

    if (faceDetectionTypes.includes(DETECTION_TYPES.FACE_BOX)) {
        detections = detections
            ? detections.map(d => d.detection)
            : await faceapi.detectAllFaces(imageTensor, new faceapi.TinyFaceDetectorOptions());

        faceBox = await detectFaceBox({
            detections,
            threshold
        });
    }

    faceapi.tf.engine().endScope();

    if (faceBox || faceExpression) {
        self.postMessage({
            faceBox,
            faceExpression
        });
    }

    detectionInProgress = false;
};

const init = async ({ baseUrl, detectionTypes }) => {
    faceDetectionTypes = detectionTypes;

    if (!backendSet) {
        try {
            if (self.useWasm) {
                setWasmPaths(baseUrl);
                await faceapi.tf.setBackend('wasm');
            } else {
                await faceapi.tf.setBackend('webgl');
            }
            backendSet = true;
        } catch (err) {
            initError = true;

            return;
        }
    }

    // load face detection model
    if (!modelsLoaded) {
        try {
            await faceapi.loadTinyFaceDetectorModel(baseUrl);

            if (detectionTypes.includes(DETECTION_TYPES.FACE_EXPRESSIONS)) {
                await faceapi.loadFaceExpressionModel(baseUrl);
            }

            modelsLoaded = true;
        } catch (err) {
            initError = true;

            return;
        }
    }
};

onmessage = function(message) {
    switch (message.data.type) {
    case DETECT_FACE: {
        if (!backendSet || !modelsLoaded || initError || detectionInProgress) {
            return;
        }

        detect(message.data);

        break;
    }

    case INIT_WORKER: {
        init(message.data);
        break;
    }
    }
};
