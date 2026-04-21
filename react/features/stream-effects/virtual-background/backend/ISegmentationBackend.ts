import { IDeviceCapabilities } from '../DeviceTierDetector';

/**
 * Abstraction over the segmentation inference backend.
 *
 * Two implementations exist:
 * - {@code MainThreadTFLiteBackend} — V1 main-thread TFLite WASM inference.
 * - {@code WorkerSegmentationBackend} — V2 VBInferenceWorker (TF.js or TFLite in a dedicated Worker).
 */
export interface ISegmentationBackend {

    /**
     * Device capabilities detected at construction time.
     */
    readonly capabilities: IDeviceCapabilities;

    /**
     * Runs segmentation on a pre-scaled camera frame and returns the mask.
     *
     * @param {ImageBitmap} bitmap - Camera frame at the tier's segmentation resolution.
     * @returns {Promise<ImageData | null>} Segmentation mask, or null on failure.
     */
    infer: (bitmap: ImageBitmap) => Promise<ImageData | null>;

    /**
     * Performs one-time async initialisation (model loading, backend setup).
     *
     * @returns {Promise<void>} Resolves when the backend is ready for inference.
     */
    init: () => Promise<void>;

    /**
     * Releases all resources held by the backend.
     *
     * @returns {Promise<void>} Resolves when cleanup is complete.
     */
    stop: () => Promise<void>;
}
