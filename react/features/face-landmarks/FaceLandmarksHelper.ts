import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';
import { Human, Config, FaceResult } from '@vladmandic/human';

import { DETECTION_TYPES, FACE_EXPRESSIONS_NAMING_MAPPING } from './constants';

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
    detectionTypes: string[],
    maxFacesDetected?: number
}

type DetectOutput = {
    faceExpression?: string,
    faceBox?: FaceBox
};

export interface FaceLandmarksHelper {
    getFaceBox({ detections, threshold }: Detection): FaceBox | undefined;
    getFaceExpression({ detections }: Detection): string | undefined;
    init(): Promise<void>;
    detect({ image, threshold } : DetectInput): Promise<DetectOutput | undefined>;
    getDetectionInProgress(): boolean;
}

/**
 * Helper class for human library
 */
export class HumanHelper implements FaceLandmarksHelper {
    protected human: Human | undefined;
    protected faceDetectionTypes: string[];
    protected baseUrl: string;
    protected maxFacesDetected?: number;
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
                maxDetected: 4
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

    constructor({ baseUrl, detectionTypes, maxFacesDetected }: InitInput) {
        this.faceDetectionTypes = detectionTypes;
        this.baseUrl = baseUrl;
        this.maxFacesDetected = maxFacesDetected;
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
            
            if (this.maxFacesDetected && this.config.face?.detector) {
                this.config.face.detector.maxDetected = this.maxFacesDetected;
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

    getFaceBox({ detections, threshold }: Detection): FaceBox | undefined {
        if (!detections.length) {
            return;
        }
    
        const faceBox: FaceBox = {
            // normalize to percentage based
            left: Math.round(Math.min(...detections.map(d => d.boxRaw[0])) * 100),
            right: Math.round(Math.max(...detections.map(d => d.boxRaw[0] + d.boxRaw[2])) * 100)
        };
    
        faceBox.width = Math.round(faceBox.right - faceBox.left);
    
        if (this.lastValidFaceBox && threshold && Math.abs(this.lastValidFaceBox.left - faceBox.left) < threshold) {
            return;
        }
    
        this.lastValidFaceBox = faceBox;
    
        return faceBox;
    }

    getFaceExpression({ detections }: Detection): string | undefined {
        if (detections[0]?.emotion) {
            return  FACE_EXPRESSIONS_NAMING_MAPPING[detections[0]?.emotion[0].emotion];
        }
    }

    public async detect({ image, threshold } : DetectInput): Promise<DetectOutput | undefined> {
        let detections;
        let faceExpression;
        let faceBox;

        if (!this.human){
            return;
        }

        this.detectionInProgress = true;
        this.human.tf.engine().startScope();

        const imageTensor = this.human.tf.browser.fromPixels(image);

        if (this.faceDetectionTypes.includes(DETECTION_TYPES.FACE_EXPRESSIONS)) {
            const { face } = await this.human.detect(imageTensor, this.config);

            detections = face;
            faceExpression = this.getFaceExpression({ detections });
        }

        if (this.faceDetectionTypes.includes(DETECTION_TYPES.FACE_BOX)) {
            if (!detections) {
                const { face } = await this.human.detect(imageTensor, this.config);

                detections = face;
            }

            faceBox = this.getFaceBox({
                detections,
                threshold
            });
        }

        this.human.tf.engine().endScope();
        this.detectionInProgress = false;

        return { 
            faceExpression, 
            faceBox
        }
    }

    public getDetectionInProgress(): boolean {
        return this.detectionInProgress;
    }
}