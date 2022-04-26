import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';
import { Human, Config, FaceResult } from '@vladmandic/human';

import { DETECTION_TYPES, DETECT_FACE, INIT_WORKER, FACE_EXPRESSIONS_NAMING_MAPPING } from './constants';

type Detection = {
    detections: Array<FaceResult>,
    threshold?: number
};

type DetectInput = {
    image: ImageBitmap | ImageData,
    threshold: number
};

type FaceBox = {
    left: number,
    right: number,
    width?: number
};

type InitInput = {
    baseUrl: string,
    detectionTypes: string[]
}

/**
 * An object that is used for using human.
 */
let human: Human;

/**
 * Detection types to be applied.
 */
let faceDetectionTypes: string[] = [];

/**
 * Flag for indicating whether a face detection flow is in progress or not.
 */
let detectionInProgress = false;

/**
 * Contains the last valid face bounding box (passes threshold validation) which was sent to the main process.
 */
let lastValidFaceBox: FaceBox;

/**
 * Configuration for human.
 */
const config: Partial<Config> = {
    backend: 'humangl',
    async: true,
    warmup: 'none',
    cacheModels: true,
    cacheSensitivity: 0,
    debug: false,
    deallocate: true,
    filter: { enabled: false },
    face: {
        enabled: true,
        detector: {
            enabled: true,
            rotation: false
        },
        mesh: { enabled: false },
        iris: { enabled: false },
        emotion: { enabled: false },
        description: { enabled: false }
    },
    hand: { enabled: false },
    gesture: { enabled: false },
    body: { enabled: false },
    segmentation: { enabled: false }
};

const detectFaceBox = async ({ detections, threshold }: Detection) => {
    if (!detections.length) {
        return null;
    }

    const faceBox: FaceBox = {
        // normalize to percentage based
        left: Math.round(Math.min(...detections.map(d => d.boxRaw[0])) * 100),
        right: Math.round(Math.max(...detections.map(d => d.boxRaw[0] + d.boxRaw[2])) * 100)
    };

    faceBox.width = Math.round(faceBox.right - faceBox.left);

    if (lastValidFaceBox && threshold && Math.abs(lastValidFaceBox.left - faceBox.left) < threshold) {
        return null;
    }

    lastValidFaceBox = faceBox;

    return faceBox;
};

const detectFaceExpression = async ({ detections }: Detection) => 
    detections[0]?.emotion && FACE_EXPRESSIONS_NAMING_MAPPING[detections[0]?.emotion[0].emotion];

const detect = async ({ image, threshold } : DetectInput) => {
    let detections;
    let faceExpression;
    let faceBox;

    detectionInProgress = true;

    const imageTensor = human.tf.browser.fromPixels(image);

    if (faceDetectionTypes.includes(DETECTION_TYPES.FACE_EXPRESSIONS)) {
        const { face } = await human.detect(imageTensor, config);

        detections = face;
        faceExpression = await detectFaceExpression({ detections });
    }

    if (faceDetectionTypes.includes(DETECTION_TYPES.FACE_BOX)) {
        if (!detections) {
            const { face } = await human.detect(imageTensor, config);

            detections = face;
        }

        faceBox = await detectFaceBox({
            detections,
            threshold
        });
    }

    if (faceBox || faceExpression) {
        self.postMessage({ 
            faceBox, 
            faceExpression 
        });
    }

    detectionInProgress = false;
};

const init = async ({ baseUrl, detectionTypes }: InitInput) => {
    faceDetectionTypes = detectionTypes;

    if (!human) {
        config.modelBasePath = baseUrl;
        if (!self.OffscreenCanvas) {
            config.backend = 'wasm';
            config.wasmPath = baseUrl;
            setWasmPaths(baseUrl);
        }
        if (detectionTypes.includes(DETECTION_TYPES.FACE_EXPRESSIONS) && config.face) {
            config.face.emotion = { enabled: true };
        }
        const initialHuman = new Human(config);
        try {
            await initialHuman.load();
        } catch (err) {
            console.error(err);
        }
        
        human = initialHuman;
    }
};

onmessage = function(message: MessageEvent<any>) {
    switch (message.data.type) {
    case DETECT_FACE: {
        if (!human || detectionInProgress) {
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
