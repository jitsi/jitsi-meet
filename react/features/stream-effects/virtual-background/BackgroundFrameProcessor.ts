import { IVirtualBackgroundAdvancedConfig } from '../../base/config/configType';
import { VIRTUAL_BACKGROUND_TYPE } from '../../virtual-background/constants';
import logger from '../../virtual-background/logger';
import { IVirtualBackground } from '../../virtual-background/reducer';

import { BackendType } from './DeviceTierDetector';
import WorkerSegmentationBackend from './backend/WorkerSegmentationBackend';
import { ICompositor } from './compositor/ICompositor';

/** Benchmark log interval in frames. */
const BENCHMARK_LOG_INTERVAL = 60;

/** Default temporal blend ratio — 75% toward previous blended mask. */
const DEFAULT_TEMPORAL_BLEND_RATIO = 0.75;

/**
 * Default smoothstep lower threshold for the LOW tier (TFLite selfie_segmentation_landscape).
 * The landscape model (MediaPipe 2021, 256x144) produces softer confidences than modern models:
 * hair strands typically sit in [0.10, 0.35], body/face in [0.60, 0.95], and true background
 * below 0.10. A floor of 0.10 keeps hair in the transition zone without admitting background.
 */
const DEFAULT_EDGE_LOW_TFLITE = 0.1;

/**
 * Default smoothstep upper threshold for the LOW tier. The landscape model rarely saturates
 * to 1.0 even on clear body pixels, so the upper edge sits at 0.50 — pixels with confidence
 * above this are fully opaque.
 */
const DEFAULT_EDGE_HIGH_TFLITE = 0.5;

/**
 * Default smoothstep lower threshold for MEDIUM/HIGH tiers (TF.js MediaPipe body-segmentation).
 * Background pixels near edges are typically below 0.25 and hair/edge pixels fall in 0.28-0.65.
 */
const DEFAULT_EDGE_LOW_GPU = 0.28;

/**
 * Default smoothstep upper threshold for MEDIUM/HIGH tiers. Pixels above this are fully opaque.
 */
const DEFAULT_EDGE_HIGH_GPU = 0.65;

/**
 * Target Gaussian feathering radius expressed in camera-output pixels. The backend returns a mask
 * at the tier's segmentation resolution. The compositor applies blur in mask-pixel space, so the
 * radius is scaled proportionally to keep the physical blur width constant.
 */
const TARGET_BLUR_CAMERA_PX = 20;

/**
 * Target feathering width for the LOW tier (overrides TARGET_BLUR_CAMERA_PX when the backend is
 * TFLite). The 256x144 mask upscales ~5x to a 1280x720 output, so a wider feathering radius
 * softens the upscale artefacts and helps hide the model's coarse hair boundary.
 */
const TARGET_BLUR_CAMERA_PX_TFLITE = 32;

/**
 * Options for constructing a BackgroundFrameProcessor.
 */
interface IProcessorOptions {
    backend: WorkerSegmentationBackend;
    compositor: ICompositor;
    vbConfig?: IVirtualBackgroundAdvancedConfig;
    virtualBackground: IVirtualBackground;
}

/**
 * Orchestrates per-frame segmentation and compositing.
 *
 * Called by the InsertableStreams pipeline (or the captureStream fallback loop in
 * JitsiStreamBackgroundEffect) for every incoming camera frame. Internally it:
 * 1. Pre-scales the frame to the backend's segmentation resolution.
 * 2. Runs inference (with configurable stride/skip for CPU backends).
 * 3. Applies exponential moving average (EMA) temporal smoothing to the mask.
 * 4. Prepares the background canvas (blur or image).
 * 5. Calls the compositor to produce the final output.
 *
 * Does NOT own the frame delivery loop or the output stream — that is the pipeline's job.
 */
/** Number of consecutive inference failures before firing the failure callback. */
const FAILURE_THRESHOLD = 30;

export default class BackgroundFrameProcessor {
    _backend: WorkerSegmentationBackend;
    _backgroundCanvas: HTMLCanvasElement;
    _backgroundCtx: CanvasRenderingContext2D | null = null;
    _benchmarkAccumTotal = 0;
    _benchmarkFrameCount = 0;
    _cachedMaskData: ImageData | null = null;
    _compositor: ICompositor;
    _consecutiveFailures = 0;
    _edgeHigh: number;
    _edgeLow: number;
    _firstMaskFrame = true;
    _frameCount = 0;
    _inferenceSkipCounter = 0;
    _isReady = false;
    _maskAccumF32: Float32Array | null = null;
    _options: IVirtualBackground;
    _temporalBlendRatio: number;
    _vbConfig?: IVirtualBackgroundAdvancedConfig;
    _virtualImage: HTMLImageElement | null = null;

    /**
     * Called once when inference fails persistently (FAILURE_THRESHOLD consecutive failures).
     * The processor switches to permanent passthrough after firing. Set by the effect owner
     * to dispatch a UI notification and revert Redux state.
     */
    onInferenceFailure: (() => void) | null = null;

    /**
     * Creates a new background frame processor.
     *
     * @param {IProcessorOptions} opts - Construction options.
     */
    constructor(opts: IProcessorOptions) {
        this._backend = opts.backend;
        this._compositor = opts.compositor;
        this._vbConfig = opts.vbConfig;
        this._options = opts.virtualBackground;

        this._temporalBlendRatio = opts.vbConfig?.temporalBlendRatio
            ?? DEFAULT_TEMPORAL_BLEND_RATIO;

        // Tier-specific edge thresholds — only used by WebGL compositor (V2).
        // V1 Canvas 2D path ignores these (mask is used as-is for alpha compositing).
        const isTFLite = opts.backend.capabilities.backend === BackendType.TFLITE;
        const defaultEdgeLow = isTFLite ? DEFAULT_EDGE_LOW_TFLITE : DEFAULT_EDGE_LOW_GPU;
        const defaultEdgeHigh = isTFLite ? DEFAULT_EDGE_HIGH_TFLITE : DEFAULT_EDGE_HIGH_GPU;

        this._edgeLow = opts.vbConfig?.edgeLow ?? defaultEdgeLow;
        this._edgeHigh = opts.vbConfig?.edgeHigh ?? defaultEdgeHigh;

        // Set up virtual image if needed.
        if (opts.virtualBackground.backgroundType === VIRTUAL_BACKGROUND_TYPE.IMAGE) {
            this._virtualImage = document.createElement('img');
            this._virtualImage.crossOrigin = 'anonymous';
            this._virtualImage.src = opts.virtualBackground.virtualSource ?? '';
        }

        this._backgroundCanvas = document.createElement('canvas');
    }

    /**
     * Initialises the backend (model loading, worker spawn, etc.). Idempotent — safe to call
     * multiple times (e.g. pre-init in the factory then again in startEffect).
     *
     * @returns {Promise<void>} Resolves when ready for inference.
     */
    async init(): Promise<void> {
        if (this._isReady) {
            return;
        }
        await this._backend.init();
        this._isReady = true;
        logger.debug('[BackgroundFrameProcessor] Backend init complete');
    }

    /**
     * Processes one camera frame through segmentation and compositing.
     *
     * @param {CanvasImageSource} source - Current camera frame.
     * @returns {Promise<HTMLCanvasElement | null>} Compositor output canvas, or null for passthrough.
     */
    async processFrame(source: CanvasImageSource): Promise<HTMLCanvasElement | null> {
        if (!this._isReady) {
            return null;
        }

        const frameStart = performance.now();
        let maskData: ImageData | null = null;

        // CPU backends (TFLite) skip every Nth frame and reuse the cached mask.
        // GPU tiers (MEDIUM/HIGH) run inference every frame.
        const isCpuBackend = this._backend.capabilities.backend === BackendType.TFLITE;
        const stride = isCpuBackend
            ? (this._vbConfig?.inferenceStride ?? 2)
            : 1;
        const runInference = this._inferenceSkipCounter % stride === 0;

        this._inferenceSkipCounter++;

        if (runInference) {
            try {
                const { segWidth, segHeight } = this._backend.capabilities;
                const bitmap = await createImageBitmap(source, {
                    resizeHeight: segHeight,
                    resizeQuality: 'medium',
                    resizeWidth: segWidth
                });

                const fresh = await this._backend.infer(bitmap);

                if (fresh) {
                    this._cachedMaskData = this._applyMaskEMA(fresh);
                    this._consecutiveFailures = 0;
                } else {
                    this._consecutiveFailures++;
                    this._checkFailureThreshold();
                }
            } catch (err) {
                logger.error('[BackgroundFrameProcessor] Inference error', err);
                this._consecutiveFailures++;
                this._checkFailureThreshold();
            }
        }
        maskData = this._cachedMaskData;

        this._frameCount++;

        // Benchmark logging.
        if (this._vbConfig?.testMode) {
            this._benchmarkAccumTotal += performance.now() - frameStart;
            this._benchmarkFrameCount++;
            if (this._benchmarkFrameCount >= BENCHMARK_LOG_INTERVAL) {
                this._logBenchmark();
            }
        }

        if (!maskData) {
            return null;
        }

        // Ensure compositor and background canvas match the source dimensions.
        const srcWidth = (source as HTMLVideoElement).videoWidth
            ?? (source as VideoFrame).displayWidth
            ?? (source as HTMLVideoElement).width;
        const srcHeight = (source as HTMLVideoElement).videoHeight
            ?? (source as VideoFrame).displayHeight
            ?? (source as HTMLVideoElement).height;

        if (this._backgroundCanvas.width !== srcWidth
                || this._backgroundCanvas.height !== srcHeight) {
            this._backgroundCanvas.width = srcWidth;
            this._backgroundCanvas.height = srcHeight;
            this._backgroundCtx = this._backgroundCanvas.getContext('2d');
            this._compositor.resize(srcWidth, srcHeight);
        }

        // Prepare background canvas (blur or image).
        this._prepareBackground(source);

        // Composite. The TFLite tier gets a wider feathering radius because its 256x144 mask
        // upscales by ~5x to the output and benefits from extra softening at the person boundary.
        const targetBlurCameraPx = this._backend.capabilities.backend === BackendType.TFLITE
            ? TARGET_BLUR_CAMERA_PX_TFLITE
            : TARGET_BLUR_CAMERA_PX;
        const maskBlurRadius = Math.round(targetBlurCameraPx * maskData.width / srcWidth);

        // V1 used blur(8px) for blur backgrounds, blur(4px) for image — match that behavior.
        const isBlurBg = this._options.backgroundType === VIRTUAL_BACKGROUND_TYPE.BLUR;
        const cssBlurFilter = isBlurBg ? 'blur(8px)' : 'blur(4px)';

        this._compositor.composite(source, this._backgroundCanvas, maskData, {
            cssBlurFilter,
            edgeHigh: this._edgeHigh,
            edgeLow: this._edgeLow,
            maskBlurRadius
        });

        return this._compositor.outputCanvas;
    }

    /**
     * Releases all resources held by the processor.
     *
     * @returns {void}
     */
    dispose(): void {
        this._compositor.dispose();
        this._cachedMaskData = null;
        this._consecutiveFailures = 0;
        this._firstMaskFrame = true;
        this._maskAccumF32 = null;
        this._inferenceSkipCounter = 0;
        this._isReady = false;
        this._backgroundCtx = null;
        this.onInferenceFailure = null;
    }

    /**
     * Checks whether consecutive inference failures have exceeded the threshold. When they do,
     * fires the {@code onInferenceFailure} callback once and switches to permanent passthrough.
     *
     * @private
     * @returns {void}
     */
    _checkFailureThreshold(): void {
        if (this._consecutiveFailures >= FAILURE_THRESHOLD && this.onInferenceFailure) {
            logger.error(
                '[BackgroundFrameProcessor] Persistent inference failure'
                + ` (${FAILURE_THRESHOLD} consecutive) — switching to passthrough`
            );
            this.onInferenceFailure();
            this.onInferenceFailure = null;
            this._isReady = false;
        }
    }

    /**
     * Applies exponential moving average (EMA) temporal smoothing to the raw segmentation mask.
     *
     * Uses a Float32 accumulator to avoid per-step quantization from Uint8ClampedArray rounding.
     * Modified in-place on the fresh ImageData returned by the backend each call.
     *
     * @private
     * @param {ImageData} maskData - Raw segmentation mask from the backend.
     * @returns {ImageData} The same ImageData with R and A channels replaced by the EMA value.
     */
    _applyMaskEMA(maskData: ImageData): ImageData {
        const n = maskData.width * maskData.height;
        const decay = this._temporalBlendRatio;
        const newWeight = 1 - decay;

        if (!this._maskAccumF32 || this._maskAccumF32.length !== n || this._firstMaskFrame) {
            // First frame or resolution change: seed accumulator from the raw mask.
            this._maskAccumF32 = new Float32Array(n);
            const raw = maskData.data;

            for (let i = 0, j = 0; i < n; i++, j += 4) {
                this._maskAccumF32[i] = raw[j]; // R = confidence * 255
            }
            this._firstMaskFrame = false;

            return maskData;
        }

        const raw = maskData.data;
        const acc = this._maskAccumF32;

        for (let i = 0, j = 0; i < n; i++, j += 4) {
            acc[i] = newWeight * raw[j] + decay * acc[i];
            raw[j] = acc[i]; // R — what the compositor shader reads as .r
            raw[j + 3] = acc[i]; // A — kept in sync for Canvas 2D fallback
        }

        return maskData;
    }

    /**
     * Renders the background (blur or image) onto the background canvas.
     *
     * @private
     * @param {CanvasImageSource} source - Camera frame source.
     * @returns {void}
     */
    _prepareBackground(source: CanvasImageSource): void {
        const ctx = this._backgroundCtx;

        if (!ctx) {
            return;
        }
        ctx.filter = 'none';

        if (this._options.backgroundType === VIRTUAL_BACKGROUND_TYPE.BLUR) {
            ctx.filter = `blur(${this._options.blurValue ?? 8}px)`;
            ctx.drawImage(source, 0, 0, this._backgroundCanvas.width, this._backgroundCanvas.height);
        } else if (this._options.backgroundType === VIRTUAL_BACKGROUND_TYPE.IMAGE && this._virtualImage) {
            ctx.drawImage(this._virtualImage, 0, 0,
                this._backgroundCanvas.width, this._backgroundCanvas.height);
        } else {
            ctx.clearRect(0, 0, this._backgroundCanvas.width, this._backgroundCanvas.height);
        }

        ctx.filter = 'none';
    }

    /**
     * Logs accumulated benchmark data every BENCHMARK_LOG_INTERVAL frames.
     *
     * @private
     * @returns {void}
     */
    _logBenchmark(): void {
        const count = this._benchmarkFrameCount;

        if (count === 0) {
            return;
        }

        const totalMs = this._benchmarkAccumTotal;
        const avgTotal = (totalMs / count).toFixed(1);
        const fps = (1000 / (totalMs / count)).toFixed(1);

        // performance.memory is Chrome-only (non-standard).
        const perfMem = (performance as unknown as { memory?: { usedJSHeapSize: number; }; }).memory;
        const heapMB = perfMem
            ? (perfMem.usedJSHeapSize / 1024 / 1024).toFixed(1)
            : 'N/A';

        logger.debug(
            '[BackgroundFrameProcessor] BENCHMARK'
            + ` avgTotal=${avgTotal}ms fps=${fps} heap=${heapMB}MB`
            + ` (frames ${this._frameCount - count + 1}-${this._frameCount})`
        );

        this._benchmarkAccumTotal = 0;
        this._benchmarkFrameCount = 0;
    }
}
