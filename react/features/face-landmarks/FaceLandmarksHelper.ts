import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';
import { Human, Config, FaceResult } from '@vladmandic/human';

import { DETECTION_TYPES, FACE_DETECTION_SCORE_THRESHOLD, FACE_EXPRESSIONS_NAMING_MAPPING } from './constants';

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

type DetectOutput = {
    faceExpression?: string,
    faceBox?: FaceBox,
    faceCount: number
};

export interface FaceLandmarksHelper {
    getFaceBox(detections: Array<FaceResult>, threshold: number): FaceBox | undefined;
    getFaceExpression(detections: Array<FaceResult>): string | undefined;
    getFaceCount(detections : Array<FaceResult>): number;
    getDetections(image: ImageBitmap | ImageData): Promise<Array<FaceResult>>;
    init(): Promise<void>;
    detect({ image, threshold } : DetectInput): Promise<DetectOutput>;
    getDetectionInProgress(): boolean;
}

/**
 * Helper class for human library
 */
export class HumanHelper implements FaceLandmarksHelper {
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

    constructor({ baseUrl, detectionTypes }: InitInput) {
        this.faceDetectionTypes = detectionTypes;
        this.baseUrl = baseUrl;
        this.init();
    }

    async init(): Promise<void> {

        if (!this.human) {
            this.config.modelBasePath = this.baseUrl;
            if (!self.OffscreenCanvas) {
                this.config.backend = 'wasm';
                this.config.wasmPath = this.baseUrl;
                setWasmPaths(this.baseUrl);
            }

            if (this.faceDetectionTypes.length > 0 && this.config.face) {
                this.config.face.enabled = true
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

    getFaceExpression(detections: Array<FaceResult>): string | undefined {
        if (this.getFaceCount(detections) !== 1) {
            return;
        }

        if (detections[0].emotion) {
            return FACE_EXPRESSIONS_NAMING_MAPPING[detections[0].emotion[0].emotion];
        }
    }

    getFaceCount(detections: Array<FaceResult> | undefined): number {
        if (detections) {
            return detections.length;
        }

        return 0;
    }

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

    public async detect({ image, threshold } : DetectInput): Promise<DetectOutput> {
        let detections;
        let faceExpression;
        let faceBox;

        this.detectionInProgress = true;

        detections = await this.getDetections(image);

        if (this.faceDetectionTypes.includes(DETECTION_TYPES.FACE_EXPRESSIONS)) {
            faceExpression = this.getFaceExpression(detections);
        }

        if (this.faceDetectionTypes.includes(DETECTION_TYPES.FACE_BOX)) {
            //if more than one face is detected the face centering will be disabled.
            if (this.getFaceCount(detections) > 1 ) {
                this.faceDetectionTypes.splice(this.faceDetectionTypes.indexOf(DETECTION_TYPES.FACE_BOX), 1);

                //face-box for re-centering
                faceBox = {
                    left: 0,
                    right: 100,
                    width: 100,
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
        }
    }

    public getDetectionInProgress(): boolean {
        return this.detectionInProgress;
    }
}