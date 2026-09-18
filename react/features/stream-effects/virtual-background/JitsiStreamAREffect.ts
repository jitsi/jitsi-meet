// @ts-ignore
import * as THREE from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import logger from '../../virtual-background/logger';

// ---------------------------------------------------------------------------
// Landmark indices for MediaPipe 478-point face mesh.
// Reference: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker
// LandMarks: https://storage.googleapis.com/mediapipe-assets/documentation/mediapipe_face_landmark_fullsize.png
// ---------------------------------------------------------------------------
const LM = {
    NOSE_TIP: 4,
    NOSE_BRIDGE: 168,
    FOREHEAD: 10,
    CHIN: 152,
    LEFT_EYE_OUTER: 263,
    LEFT_EYE_INNER: 362,
    RIGHT_EYE_OUTER: 33,
    RIGHT_EYE_INNER: 133
};

const DEFAULT_CONFIG = {
    POSITION_ALPHA: 1,
    SCALE_ALPHA: 1,
    ROTATION_SLERP: 1
};

// Number of consecutive stable frames required before locking in the eye-span/face-height
// calibration ratio. Waiting avoids calibrating off a single bad-angle/blink frame.
const CALIBRATION_FRAMES_NEEDED = 10;

// ---------------------------------------------------------------------------
// Coordinate conversion: MediaPipe (Y down, Z into image) -> Three.js (Y up, Z toward viewer)
// ---------------------------------------------------------------------------
const COORD_FLIP_MATRIX = new THREE.Matrix4().set(
    1, 0, 0, 0,
    0, -1, 0, 0,
    0, 0, -1, 0,
    0, 0, 0, 1
);

export interface IARFilterConfig {
    /** MediaPipe landmark index to anchor the model to. Defaults to nose bridge (168). */
    anchorLandmark: number;

    /** Depth offset along the model's local Z axis. Positive moves the model toward the viewer. Tuned per model. */
    depthOffset: number;

    /** Stable identifier used for logging and runtime switching. */
    id: string;

    /** GLB filename only — no path. Must match images/ar/models/ exactly, case-sensitive. */
    modelFile: string;

    /** Width of the rendered model relative to the outer-eye-corner span. Tuned per model. */
    scaleMultiplier: number;

    /** Tooltip translation key shown in the AR filter picker UI. */
    tooltip?: string;

    /** Vertical offset in world units. Positive moves the model up in canvas space. Tuned per model. */
    verticalOffset: number;
}

export class JitsiStreamAREffect {
    private readonly _baseUrl: string;

    private scene: THREE.Scene;
    private camera: THREE.OrthographicCamera;
    private renderer: THREE.WebGLRenderer;
    private canvas: HTMLCanvasElement;
    private loader: GLTFLoader;

    private pivotGroup: THREE.Group | null = null;
    private offsetGroup: THREE.Group | null = null;
    private glbNaturalWidth = 1;

    private videoWidth: number;
    private videoHeight: number;

    private _currentFilter: IARFilterConfig | null = null;

    private smoothPos = new THREE.Vector3();
    private smoothScale = 1;
    private smoothQuat = new THREE.Quaternion();
    private isFirstPose = true;

    // Calibration state — see getFrameDataForType(). Reset whenever tracking is lost or a
    // new filter/model is loaded, since the ratio is meaningless across sessions/models.
    private _calibratedEyeToHeightRatio: number | null = null;
    private _calibrationFrameCount = 0;

    constructor(baseUrl: string, width: number, height: number) {
        this._baseUrl = baseUrl.replace(/\/?$/, '/');

        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;

        this.scene = new THREE.Scene();

        this.videoWidth = width;
        this.videoHeight = height;

        this.camera = new THREE.OrthographicCamera(
            -width / 2, width / 2,
            height / 2, -height / 2,
            -2000, 2000
        );
        this.camera.position.z = 1000;

        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            canvas: this.canvas,
            powerPreference: 'low-power'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2));
        this.renderer.setClearColor(0x000000, 0);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);

        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);

        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        this.loader = new GLTFLoader();
    }

    /**
     * Loads or hot-swaps the GLB model for the given filter. Resets calibration state since
     * a new model has a different natural width and possibly a different face proportionally.
     *
     * @param {IARFilterConfig} filter - Filter configuration.
     * @returns {void}
     */
    public loadFilter(filter: IARFilterConfig): void {
        this._currentFilter = filter;
        this._disposeModel();
        this._resetCalibration();

        const url = `${this._baseUrl}images/ar/models/${filter.modelFile}`;

        logger.debug(`[AR] Loading GLB "${filter.id}" from ${url}`);

        this.loader.load(
            url,
            (gltf: any) => this._onGLTFLoaded(gltf, filter),
            undefined,
            (err: any) => {
                logger.error(`[AR] Failed to load "${filter.modelFile}":`, err);
            }
        );
    }

    /**
     * Callback invoked once the GLB model is loaded.
     *
     * @private
     * @param {any} gltf - Loaded glTF scene graph from GLTFLoader.
     * @param {IARFilterConfig} filter - Filter configuration this model belongs to.
     * @returns {void}
     */
    private _onGLTFLoaded(gltf: any, filter: IARFilterConfig): void {
        const rawModel = gltf.scene;

        const bbox = new THREE.Box3().setFromObject(rawModel);
        const size = bbox.getSize(new THREE.Vector3());
        const center = bbox.getCenter(new THREE.Vector3());
        const minPoint = bbox.min;

        this.glbNaturalWidth = size.x || 1;

        this.offsetGroup = new THREE.Group();

        this.offsetGroup.rotation.y = Math.PI;
        this.offsetGroup.scale.set(-1, -1, 1);
        rawModel.position.set(center.x, center.y, -(minPoint.z));
        this.offsetGroup.add(rawModel);

        this.pivotGroup = new THREE.Group();
        this.pivotGroup.add(this.offsetGroup);
        this.scene.add(this.pivotGroup);

        this.pivotGroup.visible = false;
        this.isFirstPose = true;

        logger.debug('[AR] Model loaded successfully', {
            center,
            filterId: filter.id,
            originalHeight: size.y,
            originalWidth: size.x
        });
    }

    /**
     * Converts a MediaPipe facial transformation matrix into a Three.js quaternion.
     *
     * @private
     * @param {number[]} matrixData - 4x4 facial transformation matrix from MediaPipe, row-major.
     * @returns {THREE.Quaternion}
     */
    private static matrixToQuaternion(matrixData: number[]): THREE.Quaternion {
        const rotMatrix = new THREE.Matrix4().set(
            matrixData[0], matrixData[1], matrixData[2], 0,
            matrixData[4], matrixData[5], matrixData[6], 0,
            matrixData[8], matrixData[9], matrixData[10], 0,
            0, 0, 0, 1
        );

        const threeMatrix = COORD_FLIP_MATRIX.clone().multiply(rotMatrix);
        const rawQuat = new THREE.Quaternion().setFromRotationMatrix(threeMatrix);

        return new THREE.Quaternion(rawQuat.x, rawQuat.y, rawQuat.z, -rawQuat.w);
    }

    /**
     * Converts a normalized MediaPipe landmark into a Three js world-space vector.
     *
    * @private
    * @param {Array} lm - Raw 478-point landmark mesh for this frame.
    * @param {number} idx - Landmark index.
    * @returns {THREE.Vector3}
     */
    private landmarkToWorld(lm: number[][], idx: number): THREE.Vector3 {
        const W = this.videoWidth;
        const H = this.videoHeight;

        return new THREE.Vector3(
            (lm[idx][0] - 0.5) * W,
            (0.5 - lm[idx][1]) * H,
            -lm[idx][2] * Math.max(W, H) * 0.8
        );
    }

    /**
     * Computes the pivot origin and a stable scale-reference span for the given filter type.
     *
     * Scale is derived from a one-time calibrated ratio between eye-span and face-height,
     * after calibration Face-height (forehead-to-chin) is used for scaling - with the 3D distance
     * between the eyes in the normalized frame set to the calibrated eye-span-to-face-height ratio
     * multiplied by face-height.
     *
     * @private
     * @param {Array} mesh - Raw landmark mesh for this frame.
     * @returns {Object} Object containing origin and referenceSpan.
     */
    private getFrameDataForType(
            mesh: number[][]
    ): { origin: THREE.Vector3; referenceSpan: number; } {
        const forehead = this.landmarkToWorld(mesh, LM.FOREHEAD);
        const chin = this.landmarkToWorld(mesh, LM.CHIN);
        const faceHeight = new THREE.Vector3().subVectors(forehead, chin).length();

        const leftEyeOuter = this.landmarkToWorld(mesh, LM.LEFT_EYE_OUTER);
        const rightEyeOuter = this.landmarkToWorld(mesh, LM.RIGHT_EYE_OUTER);
        const eyeSpan3D = leftEyeOuter.clone().sub(rightEyeOuter).length();

        if (this._calibratedEyeToHeightRatio === null && faceHeight > 0) {
            this._calibrationFrameCount++;
            if (this._calibrationFrameCount >= CALIBRATION_FRAMES_NEEDED) {
                this._calibratedEyeToHeightRatio = eyeSpan3D / faceHeight;
            }
        }

        const stableEyeSpan = this._calibratedEyeToHeightRatio !== null
            ? faceHeight * this._calibratedEyeToHeightRatio
            : eyeSpan3D;

        const anchorIdx = this._currentFilter?.anchorLandmark ?? LM.NOSE_BRIDGE;
        const origin = this.landmarkToWorld(mesh, anchorIdx);

        return { origin, referenceSpan: stableEyeSpan };
    }

    /**
     * Renders one AR frame. Called once per camera frame.
     *
     * @param {Array} faceLandmarks - 478-point face mesh, or null if no face detected.
     * @param {Array} facialTransformationMatrix - 4x4 head-pose matrix from MediaPipe.
     * @returns {void}
     */
    public update(
            faceLandmarks: number[][] | null,
            facialTransformationMatrix: number[] | null
    ): void {
        if (!this.pivotGroup) {
            this.renderer.render(this.scene, this.camera);

            return;
        }

        if (!faceLandmarks || faceLandmarks.length < 468) {
            if (this.pivotGroup.visible) {
                this.pivotGroup.visible = false;
            }
            this.isFirstPose = true;
            this.renderer.render(this.scene, this.camera);

            return;
        }

        const rawMesh = faceLandmarks;

        let targetQuat: THREE.Quaternion;

        if (facialTransformationMatrix && facialTransformationMatrix.length >= 16) {
            targetQuat = JitsiStreamAREffect.matrixToQuaternion(facialTransformationMatrix);
        } else {
            targetQuat = new THREE.Quaternion();
        }

        const { origin, referenceSpan } = this.getFrameDataForType(rawMesh);

        const targetPos = origin.clone();
        const vertOffset = this._currentFilter?.verticalOffset ?? 0;

        targetPos.y += vertOffset;

        const widthMultiplier = this._currentFilter?.scaleMultiplier ?? 1.0;
        const targetWidth = referenceSpan * widthMultiplier;
        const targetScale = targetWidth / (this.glbNaturalWidth + 0.0001);

        const pivotDepth = this._currentFilter?.depthOffset ?? 0;
        const forwardOffset = new THREE.Vector3(0, 0, pivotDepth * targetScale).applyQuaternion(targetQuat);

        targetPos.add(forwardOffset);

        if (this.isFirstPose) {
            this.smoothPos.copy(targetPos);
            this.smoothScale = targetScale;
            this.smoothQuat.copy(targetQuat);
            this.isFirstPose = false;
        } else {
            this.smoothPos.lerp(targetPos, DEFAULT_CONFIG.POSITION_ALPHA);
            this.smoothScale += DEFAULT_CONFIG.SCALE_ALPHA * (targetScale - this.smoothScale);
            this.smoothQuat.slerp(targetQuat, DEFAULT_CONFIG.ROTATION_SLERP);
        }

        this.pivotGroup.visible = true;
        this.pivotGroup.position.copy(this.smoothPos);
        this.pivotGroup.quaternion.copy(this.smoothQuat);
        this.pivotGroup.scale.setScalar(this.smoothScale);

        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Returns the off-screen canvas the compositor samples as a texture each frame.
     * Always has alpha channel — transparent where no model is drawn.
     *
     * @returns {HTMLCanvasElement}
     */
    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    /**
     * Resets pose and calibration state. Call when the face is lost
     * or a new filter is loaded to avoid interpolating from a stale pose.
     *
     * @returns {void}
     */
    public resetState(): void {
        this.isFirstPose = true;
        this._resetCalibration();
        if (this.pivotGroup) {
            this.pivotGroup.visible = false;
        }
    }

    /**
     * Resizes the renderer and camera frustum to match the actual output resolution.
     * Called by BackgroundFrameProcessor whenever the source frame dimensions change.
     *
     * @param {number} width - New canvas/tracking width.
     * @param {number} height - New canvas/tracking height.
     * @returns {void}
     */
    public resize(width: number, height: number): void {
        this.videoWidth = width;
        this.videoHeight = height;

        this.canvas.width = width;
        this.canvas.height = height;

        this.camera.left = -width / 2;
        this.camera.right = width / 2;
        this.camera.top = height / 2;
        this.camera.bottom = -height / 2;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    /**
     * Resets the eye-span-to-face-height calibration.
     *
     * @private
     * @returns {void}
     */
    private _resetCalibration(): void {
        this._calibratedEyeToHeightRatio = null;
        this._calibrationFrameCount = 0;
    }

    /**
     * Removes the GLB model from the scene and disposes all associated resources.
     *
     * @private
     * @returns {void}
     */
    private _disposeModel(): void {
        if (this.pivotGroup) {
            this.scene.remove(this.pivotGroup);
            this.pivotGroup.traverse((obj: THREE.Object3D) => {
                if ((obj as THREE.Mesh).isMesh) {
                    const mesh = obj as THREE.Mesh;

                    mesh.geometry.dispose();

                    if (Array.isArray(mesh.material)) {
                        (mesh.material as THREE.Material[]).forEach(m => m.dispose());
                    } else if (mesh.material) {
                        (mesh.material as THREE.Material).dispose();
                    }
                }
            });
            this.pivotGroup = null;
            this.offsetGroup = null;
        }
    }

    /**
     * Disposes of the effect and releases resources.
     *
     * @public
     * @returns {void}
     */
    public dispose(): void {
        this._disposeModel();
        this.renderer.dispose();
    }
}
