import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';
import { Config, FaceResult, Human } from '@vladmandic/human';

import { DETECTION_TYPES, FACE_DETECTION_SCORE_THRESHOLD, FACE_EXPRESSIONS_NAMING_MAPPING } from './constants';
import { DetectInput, DetectOutput, FaceBox, FaceExpression, InitInput } from './types';

export interface IFaceLandmarksHelper {
    detect: ({ image, threshold }: DetectInput) => Promise<DetectOutput>;
    getDetectionInProgress: () => boolean;
    getDetections: (image: ImageBitmap | ImageData) => Promise<Array<FaceResult>>;
    getFaceBox: (detections: Array<FaceResult>, threshold: number) => FaceBox | undefined;
    getFaceCount: (detections: Array<FaceResult>) => number;
    getFaceExpression: (detections: Array<FaceResult>) => FaceExpression | undefined;
    init: () => Promise<void>;
}

/**
 * Helper class for human library.
 */
export class HumanHelper implements IFaceLandmarksHelper {
    protected human: Human | undefined;
    protected faceDetectionTypes: string[];
    protected baseUrl: string;
    private detectionInProgress = false;
    private lastValidFaceBox: FaceBox | undefined;

    /**
    * Configuration for human.
    */
    private config: Partial<Config> = {
        backend: 'humangl',
        async: true,
        warmup: 'none',
        cacheModels: true,
        cacheSensitivity: 0,
        debug: false,
        deallocate: true,
        filter: { enabled: false },
        face: {
            enabled: false,
            detector: {
                enabled: false,
                rotation: false,
                modelPath: 'blazeface-front.json',
                maxDetected: 20
            },
            mesh: { enabled: false },
            iris: { enabled: false },
            emotion: {
                enabled: false,
                modelPath: 'emotion.json'
            },
            description: { enabled: false }
        },
        hand: { enabled: false },
        gesture: { enabled: false },
        body: { enabled: false },
        segmentation: { enabled: false }
    };

    /**
     * Constructor function for the helper which initialize the helper.
     *
     * @param  {InitInput} input - The input for the helper.
     * @returns {void}
     */
    constructor({ baseUrl, detectionTypes }: InitInput) {
        this.faceDetectionTypes = detectionTypes;
        this.baseUrl = baseUrl;
        this.init();
    }

    /**
     * Initializes the human helper with the available tfjs backend for the given detection types.
     *
     * @returns {Promise<void>}
     */
    async init(): Promise<void> {

        if (!this.human) {
            this.config.modelBasePath = this.baseUrl;
            if (!self.OffscreenCanvas) {
                this.config.backend = 'wasm';
                this.config.wasmPath = this.baseUrl;
                setWasmPaths(this.baseUrl);
            }

            if (this.faceDetectionTypes.length > 0 && this.config.face) {
                this.config.face.enabled = true;
            }

            if (this.faceDetectionTypes.includes(DETECTION_TYPES.FACE_BOX) && this.config.face?.detector) {
                this.config.face.detector.enabled = true;
            }

            if (this.faceDetectionTypes.includes(DETECTION_TYPES.FACE_EXPRESSIONS) && this.config.face?.emotion) {
                this.config.face.emotion.enabled = true;
            }

            const initialHuman = new Human(this.config);

            try {
                await initialHuman.load();
            } catch (err) {
                console.error(err);
            }

            this.human = initialHuman;
        }
    }

    /**
     * Gets the face box from the detections, if there is no valid detections it will return undefined..
     *
     * @param {Array<FaceResult>} detections - The array with the detections.
     * @param {number} threshold - Face box position change threshold.
     * @returns {FaceBox | undefined}
     */
    getFaceBox(detections: Array<FaceResult>, threshold: number): FaceBox | undefined {
        if (this.getFaceCount(detections) !== 1) {
            return;
        }

        const faceBox: FaceBox = {
            // normalize to percentage based
            left: Math.round(detections[0].boxRaw[0] * 100),
            right: Math.round((detections[0].boxRaw[0] + detections[0].boxRaw[2]) * 100)
        };

        faceBox.width = Math.round(faceBox.right - faceBox.left);

        if (this.lastValidFaceBox && threshold && Math.abs(this.lastValidFaceBox.left - faceBox.left) < threshold) {
            return;
        }

        this.lastValidFaceBox = faceBox;

        return faceBox;
    }

    /**
     * Gets the face expression from the detections, if there is no valid detections it will return undefined.
     *
     * @param {Array<FaceResult>} detections - The array with the detections.
     * @returns {string | undefined}
     */
    getFaceExpression(detections: Array<FaceResult>): FaceExpression | undefined {
        if (this.getFaceCount(detections) !== 1) {
            return;
        }

        const detection = detections[0];

        if (detection.emotion) {
            return {
                expression: FACE_EXPRESSIONS_NAMING_MAPPING[detection.emotion[0].emotion],
                score: detection.emotion[0].score
            };
        }
    }

    /**
     * Gets the face count from the detections, which is the number of detections.
     *
     * @param {Array<FaceResult>} detections - The array with the detections.
     * @returns {number}
     */
    getFaceCount(detections: Array<FaceResult> | undefined): number {
        if (detections) {
            return detections.length;
        }

        return 0;
    }

    /**
     * Gets the detections from the image captured from the track.
     *
     * @param {ImageBitmap | ImageData} image - The image captured from the track,
     * if OffscreenCanvas available it will be ImageBitmap, otherwise it will be ImageData.
     * @returns {Promise<Array<FaceResult>>}
     */
    async getDetections(image: ImageBitmap | ImageData): Promise<Array<FaceResult>> {
        if (!this.human || !this.faceDetectionTypes.length) {
            return [];
        }

        this.human.tf.engine().startScope();

        const imageTensor = this.human.tf.browser.fromPixels(image);
        const { face: detections } = await this.human.detect(imageTensor, this.config);

        this.human.tf.engine().endScope();

        return detections.filter(detection => detection.score > FACE_DETECTION_SCORE_THRESHOLD);
    }

    /**
     * Gathers together all the data from the detections, it's the function that will be called in the worker.
     *
     * @param {DetectInput} input - The input for the detections.
     * @returns {Promise<DetectOutput>}
     */
    public async detect({ image, threshold }: DetectInput): Promise<DetectOutput> {
        let faceExpression;
        let faceBox;

        this.detectionInProgress = true;

        const detections = await this.getDetections(image);

        if (this.faceDetectionTypes.includes(DETECTION_TYPES.FACE_EXPRESSIONS)) {
            faceExpression = this.getFaceExpression(detections);
        }

        if (this.faceDetectionTypes.includes(DETECTION_TYPES.FACE_BOX)) {
            // if more than one face is detected the face centering will be disabled.
            if (this.getFaceCount(detections) > 1) {
                this.faceDetectionTypes.splice(this.faceDetectionTypes.indexOf(DETECTION_TYPES.FACE_BOX), 1);

                // face-box for re-centering
                faceBox = {
                    left: 0,
                    right: 100,
                    width: 100
                };
            } else {
                faceBox = this.getFaceBox(detections, threshold);
            }

        }

        this.detectionInProgress = false;

        return {
            faceExpression,
            faceBox,
            faceCount: this.getFaceCount(detections)
        };
    }

    /**
     * Returns the detection state.
     *
     * @returns {boolean}
     */
    public getDetectionInProgress(): boolean {
        return this.detectionInProgress;
    }
}
