import { IConfig } from '../../base/config/configType';
import { getBaseUrl } from '../../base/util/helpers';
import { STUDIO_LIGHT_DEFAULTS, VIRTUAL_BACKGROUND_TYPE } from '../../virtual-background/constants';
import logger from '../../virtual-background/logger';

import {
    BackendType,
    DeviceTier,
    IDeviceCapabilities,
    detectDeviceTier
} from './DeviceTierDetector.web';
import { IBackgroundEffectOptions } from './JitsiStreamBackgroundEffect';
import {
    CLEAR_TIMEOUT,
    SET_TIMEOUT,
    TIMEOUT_TICK,
    timerWorkerScript
} from './TimerWorker';
import WebGLCompositor from './WebGLCompositor';

/** Benchmark log interval in frames. */
const BENCHMARK_LOG_INTERVAL = 60;

/** Default temporal blend ratio — 85 % toward previous blended mask. */
const DEFAULT_TEMPORAL_BLEND_RATIO = 0.85;

/**
 * Default smoothstep lower threshold. Pixels with EMA-smoothed confidence below this value are
 * fully transparent. Set to 0.30 to reject low-confidence background detections (distant objects,
 * chair backs, wall decorations that the model assigns 0.15–0.25 confidence) while still allowing
 * hair-boundary pixels (0.30–0.50 confidence) to enter the feathering zone.
 */
const DEFAULT_EDGE_LOW = 0.30;

/**
 * Default smoothstep upper threshold. Pixels with confidence above this value are fully opaque.
 * The 0.30–0.65 window (span 0.35) gives a gradual transition at hair and clothing edges.
 * Body interior pixels (confidence ≈ 0.9) are unaffected.
 */
const DEFAULT_EDGE_HIGH = 0.65;

/**
 * Smoothstep lower threshold for studio light. Matches the VB default (0.30) so low-confidence
 * edge pixels receive no effect rather than a partial glow that bleeds into the background.
 */
const STUDIO_LIGHT_EDGE_LOW = 0.35;

/**
 * Smoothstep upper threshold for studio light. The 0.35–0.70 window gives a gradual transition
 * at high-confidence boundaries while keeping the effect tight.
 */
const STUDIO_LIGHT_EDGE_HIGH = 0.70;

/**
 * Target Gaussian feathering radius expressed in camera-output pixels. The inference worker
 * returns a mask at the tier's segmentation resolution (e.g. 512×288 for HIGH). The compositor
 * shader applies the blur in mask-pixel space, so the radius is scaled down proportionally:
 *   maskBlurRadius = TARGET_BLUR_CAMERA_PX x maskWidth / outputWidth
 * This keeps the physical blur width constant regardless of the mask-to-output scale ratio.
 * Kept small (16px) so the feathering zone is tight — the edge-guided shader snapping handles
 * hard object boundaries while the EMA temporal smoothing handles flicker.
 */
const TARGET_BLUR_CAMERA_PX = 16;

/**
 * V2 virtual background stream effect.
 *
 * All tiers run inference in a single {@link VBInferenceWorker}: MEDIUM/HIGH tiers use TF.js
 * body-segmentation with WebGL/WebGPU; LOW tier uses ORT WASM (PP-HumanSeg FP32 at 192×192).
 * Running all inference in a Worker keeps the main thread free for UI events. For GPU tiers,
 * the Worker's OffscreenCanvas WebGL context is not subject to Chrome's tab-visibility GPU
 * scheduling throttle that affects main-document contexts.
 * All tiers use a WebGL compositor with temporal smoothing and edge feathering (Canvas 2D fallback).
 * Frame driving uses requestVideoFrameCallback + Web Worker keepalive (captureStream path) or
 * MediaStreamTrackProcessor (insertable streams path).
 *
 * Implements the same three-method interface as {@link JitsiStreamBackgroundEffect} so it is
 * transparent to all callers.
 */
export default class JitsiStreamBackgroundEffectV2 {
    _backgroundCanvas: HTMLCanvasElement;
    _backgroundCtx: CanvasRenderingContext2D | null = null;
    _benchmarkAccumTotal = 0;
    _benchmarkFrameCount = 0;
    _cachedMaskData: ImageData | null = null;
    _capabilities: IDeviceCapabilities | null = null;
    _compositor: WebGLCompositor | null = null;
    _config: IConfig;
    _edgeHigh: number;
    _edgeLow: number;
    _firstMaskFrame = true;
    _inferenceWorker: Worker | null = null;
    _workerReady = false;
    _maskAccumF32: Float32Array | null = null;
    _maskCanvas: HTMLCanvasElement | null = null;
    _maskCanvasCtx: CanvasRenderingContext2D | null = null;
    _inputVideoElement: HTMLVideoElement;
    _isLoopStarted = false;
    _isPassthrough = false;
    _isReady = false;
    _isRunning = false;
    _useInsertableStreams = false;

    /**
     * Resolves when async initialisation completes successfully, or rejects with the init error.
     * Callers (e.g. {@link toggleBackgroundEffect}) should await this after {@link startEffect}
     * so that worker/backend failures propagate instead of being silently swallowed.
     */
    initPromise: Promise<void> = Promise.resolve();
    _keepaliveWorker: Worker | null = null;
    _options: IBackgroundEffectOptions['virtualBackground'];
    _outputCanvasElement: HTMLCanvasElement;
    _outputCanvasCtx: CanvasRenderingContext2D | null = null;
    _frameCount = 0;
    _ortSkipCounter = 0;
    _processingFrame = false;
    _rVFCHandle: number | null = null;

    _stream: MediaStream | null = null;
    _trackGenerator: (MediaStreamTrack & { writable: WritableStream<VideoFrame>; }) | null = null;
    _trackProcessor: { readable: ReadableStream<VideoFrame>; } | null = null;
    _trackReader: ReadableStreamDefaultReader<VideoFrame> | null = null;
    _temporalBlendRatio: number;
    _virtualImage: HTMLImageElement | null = null;
    _webglCanvas: HTMLCanvasElement | null = null;

    /**
     * Creates a new V2 background effect instance.
     *
     * @param {Object} virtualBackground - Background options.
     * @param {IConfig} config - App configuration (for device tier detection and overrides).
     * @param {IDeviceCapabilities} [capabilities] - Pre-detected device capabilities. When provided
     * the constructor skips the async detection probe inside {@link _initAsync}.
     */
    constructor(
            virtualBackground: IBackgroundEffectOptions['virtualBackground'],
            config: IConfig,
            capabilities?: IDeviceCapabilities) {
        this._options = virtualBackground;
        this._config = config;
        this._capabilities = capabilities ?? null;

        this._temporalBlendRatio = config.virtualBackground?.temporalBlendRatio
            ?? DEFAULT_TEMPORAL_BLEND_RATIO;
        this._edgeLow = config.virtualBackground?.edgeLow ?? DEFAULT_EDGE_LOW;
        this._edgeHigh = config.virtualBackground?.edgeHigh ?? DEFAULT_EDGE_HIGH;

        if (virtualBackground.backgroundType === VIRTUAL_BACKGROUND_TYPE.IMAGE) {
            this._virtualImage = document.createElement('img');
            this._virtualImage.crossOrigin = 'anonymous';
            this._virtualImage.src = virtualBackground.virtualSource ?? '';
        }

        // Studio light uses the same segmentation pipeline but no background image.
        // _virtualImage stays null — _prepareBackground is skipped for this mode.

        // Workaround for FF issue https://bugzilla.mozilla.org/show_bug.cgi?id=1388974
        this._outputCanvasElement = document.createElement('canvas');
        this._outputCanvasElement.getContext('2d');
        this._inputVideoElement = document.createElement('video');
        this._backgroundCanvas = document.createElement('canvas');
    }

    /**
     * Checks if the local track supports this effect.
     *
     * @param {*} jitsiLocalTrack - Track to apply effect.
     * @returns {boolean} True when the effect can run on this track.
     */
    isEnabled(jitsiLocalTrack: any): boolean {
        return jitsiLocalTrack.isVideoTrack() && jitsiLocalTrack.videoType === 'camera';
    }

    /**
     * Indicates whether this effect must be applied via {@code setEffect} after track construction rather than
     * being passed to the {@code JitsiLocalTrack} constructor through the {@code effects} array.
     *
     * The insertable streams path returns a {@code MediaStreamTrackGenerator} from {@code startEffect}, whose
     * {@code getSettings()} is empty until frames flow through it. Passing such an effect to the
     * {@code JitsiLocalTrack} constructor crashes its constraint-caching logic. The captureStream path is safe
     * because {@code captureStream()} returns a track with the canvas dimensions already in {@code getSettings()}.
     *
     * @returns {boolean} True when the IS path would be used on this device/config; false otherwise.
     */
    get requiresPostConstructionApplication(): boolean {
        return this._shouldUseInsertableStreams();
    }

    /**
     * Starts the V2 effect on the given stream.
     *
     * Returns a {@code MediaStream} synchronously (required by lib-jitsi-meet's
     * {@code JitsiLocalTrack._startStreamEffect}). Async initialisation — device tier detection, TF.js backend setup,
     * and segmenter creation — runs in the background via {@link _initAsync}. Frame processing is gated on the
     * {@code _isReady} flag and only begins once init completes.
     *
     * @param {MediaStream} stream - Camera stream to process.
     * @returns {MediaStream} Processed output stream.
     */
    startEffect(stream: MediaStream): MediaStream {
        this._stream = stream;
        this._isRunning = true;

        const firstVideoTrack = stream.getVideoTracks()[0];
        const { height, frameRate, width } = firstVideoTrack.getSettings
            ? firstVideoTrack.getSettings()
            : firstVideoTrack.getConstraints();
        const videoWidth = parseInt(String(width), 10);
        const videoHeight = parseInt(String(height), 10);
        const videoFrameRate = parseInt(String(frameRate), 10);

        this._backgroundCanvas.width = videoWidth;
        this._backgroundCanvas.height = videoHeight;
        this._backgroundCtx = this._backgroundCanvas.getContext('2d');

        if (this._shouldUseInsertableStreams()) {
            this._useInsertableStreams = true;

            // Size the output canvas for the Canvas 2D compositor fallback.
            this._outputCanvasElement.width = videoWidth;
            this._outputCanvasElement.height = videoHeight;

            this._trackProcessor = new window.MediaStreamTrackProcessor(
                { track: firstVideoTrack, maxBufferSize: 2 }
            );
            this._trackGenerator = new window.MediaStreamTrackGenerator({ kind: 'video' });

            logger.debug('[VirtualBackground] Using insertable streams path');

            this.initPromise = this._initAsync(videoFrameRate);

            // Suppress unhandledrejection — the caller awaits initPromise directly.
            this.initPromise.catch(() => undefined);

            return new MediaStream([ this._trackGenerator as MediaStreamTrack ]);
        }

        // captureStream path — set up synchronously so captureStream() can return immediately.
        this._outputCanvasElement.width = videoWidth;
        this._outputCanvasElement.height = videoHeight;

        this._inputVideoElement.autoplay = true;
        this._inputVideoElement.width = videoWidth;
        this._inputVideoElement.height = videoHeight;
        this._inputVideoElement.srcObject = stream;

        this.initPromise = this._initAsync(videoFrameRate);

        // Suppress unhandledrejection — the caller awaits initPromise directly.
        this.initPromise.catch(() => undefined);

        return this._outputCanvasElement.captureStream(videoFrameRate);
    }

    /**
     * Performs async initialisation: device tier detection, TF.js backend setup, segmenter creation, and compositor
     * setup. Starts the frame driver once ready.
     *
     * @private
     * @param {number} videoFrameRate - Capture frame rate used for the worker timer interval.
     * @returns {Promise<void>}
     */
    async _initAsync(videoFrameRate: number): Promise<void> {
        if (!this._capabilities) {
            this._capabilities = await detectDeviceTier(this._config);
        }

        if (this._capabilities.tier === DeviceTier.UNSUPPORTED) {
            throw new Error('[VirtualBackground] No supported GPU or WASM backend — virtual background unavailable');
        }

        // 2D output context is needed for the Canvas 2D compositing fallback and for blitting after WebGL.
        // Assigned here so it is available for both the LOW-tier ORT path and the MEDIUM/HIGH TF.js path.
        this._outputCanvasCtx = this._outputCanvasElement.getContext('2d');

        // All tiers: WebGL compositor + VBInferenceWorker (ORT WASM for LOW, TF.js for MEDIUM/HIGH).
        // The worker runs inference in a dedicated thread — the main thread is never blocked.
        // For GPU tiers, the Worker's OffscreenCanvas WebGL context is not subject to Chrome's
        // tab-visibility GPU scheduling throttle.
        // _outputCanvasElement already has a 2D context so the compositor must use its own canvas.
        this._webglCanvas = document.createElement('canvas');
        this._webglCanvas.width = this._outputCanvasElement.width;
        this._webglCanvas.height = this._outputCanvasElement.height;
        this._compositor = new WebGLCompositor(this._webglCanvas);

        if (!this._compositor.isAvailable) {
            logger.debug('[VirtualBackground] Compositor: WebGL unavailable — using Canvas 2D fallback');
            this._compositor = null;
        }

        try {
            await this._initInferenceWorker();
        } catch (err) {
            logger.error('[VirtualBackground] Inference worker init failed', err);
            throw err;
        }

        // stopEffect() was called while we were initialising — shut down the worker and bail.
        if (!this._isRunning) {
            this._inferenceWorker?.postMessage({ type: 'stop' });
            this._inferenceWorker?.terminate();
            this._inferenceWorker = null;
            this._workerReady = false;

            return;
        }

        this._isReady = true;
        logger.debug(`[VirtualBackground] Init complete — frame rate: ${videoFrameRate} fps`);

        if (this._useInsertableStreams) {
            // Start the IS frame loop. _isReady = true (set above) ensures the loop processes
            // frames immediately rather than passing them through unmodified.
            this._runInsertableStreamsLoop();
        } else {
            // captureStream path: rVFC (visible tab) + keepalive worker (hidden tab).
            if (this._inputVideoElement.readyState >= 2) {
                this._startFrameDriver();
            } else {
                this._inputVideoElement.onloadeddata = () => this._startFrameDriver();
            }
        }
    }

    /**
     * Stops the effect and releases all resources.
     *
     * @returns {void}
     */
    stopEffect(): void {
        this._isRunning = false;
        this._isPassthrough = false;
        this._isReady = false;
        this._processingFrame = false;

        this._cancelRVFC();
        this._stopKeepalive();

        // Shut down inference worker (all tiers).
        if (this._inferenceWorker) {
            this._inferenceWorker.postMessage({ type: 'stop' });
            this._inferenceWorker.terminate();
            this._inferenceWorker = null;
        }
        this._workerReady = false;

        this._compositor?.dispose();
        this._compositor = null;

        this._inputVideoElement.onloadeddata = null;
        this._inputVideoElement.srcObject = null;
        this._stream = null;

        // IS resources: cancel the reader immediately so any VideoFrames buffered in the processor's
        // queue are flushed and closed, preventing "VideoFrame GC'd without close()" warnings.
        // The pending reader.read() in _runInsertableStreamsLoop rejects, exiting the loop without
        // waiting for the next camera frame to arrive.
        this._trackReader?.cancel().catch(() => undefined);
        this._trackReader = null;
        this._trackProcessor = null;
        this._trackGenerator = null;
        this._useInsertableStreams = false;

        this._cachedMaskData = null;
        this._firstMaskFrame = true;
        this._maskAccumF32 = null;
        this._ortSkipCounter = 0;
        this._webglCanvas = null;
        this._maskCanvas = null;
        this._maskCanvasCtx = null;
    }

    /**
     * Switches the effect into passthrough mode: raw camera frames are copied directly to the output canvas with no
     * segmentation or compositing. Called whenever async initialisation fails so the captured stream keeps delivering
     * video instead of going blank.
     *
     * @private
     * @returns {void}
     */
    _startPassthrough(): void {
        this._isPassthrough = true;

        if (this._useInsertableStreams) {
            // IS path: the loop handles passthrough by writing raw frames to the generator.
            // If _initAsync exited early (backend failure, unsupported tier), the loop was never
            // started — start it now. _isLoopStarted guards against starting a second instance.
            this._isReady = true;
            this._runInsertableStreamsLoop();

            return;
        }

        this._outputCanvasCtx = this._outputCanvasElement.getContext('2d');

        if (this._inputVideoElement.readyState >= 2) {
            this._startFrameDriver();
        } else {
            this._inputVideoElement.onloadeddata = () => this._startFrameDriver();
        }
    }

    /**
     * Starts both the rVFC driver and the keepalive worker timer concurrently.
     *
     * The rVFC driver fires in sync with each decoded camera frame and gives the best latency when the tab is visible.
     * Chrome's rVFC implementation is tied to compositor presentation — when the tab is hidden the compositor does not
     * run, so rVFC callbacks stop firing and the captureStream encoder suspends. The keepalive worker timer runs a
     * fixed-interval loop entirely inside a Web Worker (immune to main-thread throttling) and calls _processFrame() at
     * targetFps. The _processingFrame guard prevents concurrent segmentation: when the tab is visible rVFC wins the
     * race and the worker ticks are dropped; when the tab is hidden rVFC goes quiet and the worker keeps frames
     * flowing to the encoder.
     *
     * @private
     * @returns {void}
     */
    _startFrameDriver(): void {
        this._startRVFC();
        this._startKeepalive();
    }

    /**
     * Registers a requestVideoFrameCallback for the next camera frame.
     *
     * @private
     * @returns {void}
     */
    _startRVFC(): void {
        this._rVFCHandle = this._inputVideoElement.requestVideoFrameCallback(async () => {
            if (!this._isRunning) {
                return;
            }
            await this._processFrame();
            if (this._isRunning) {
                this._startRVFC();
            }
        });
    }

    /**
     * Cancels the current requestVideoFrameCallback registration.
     *
     * @private
     * @returns {void}
     */
    _cancelRVFC(): void {
        if (this._rVFCHandle !== null) {
            this._inputVideoElement.cancelVideoFrameCallback(this._rVFCHandle);
            this._rVFCHandle = null;
        }
    }

    /**
     * Starts the keepalive Web Worker timer. The next tick is posted immediately upon receiving the previous tick
     * — independent of how long _processFrame() takes — so the timer maintains a true fixed interval regardless of GPU
     * load. Concurrent calls to _processFrame() are blocked by the _processingFrame guard.
     *
     * @private
     * @returns {void}
     */
    _startKeepalive(): void {
        if (this._keepaliveWorker) {
            return;
        }
        const intervalMs = 1000 / (this._capabilities?.targetFps ?? 30);

        this._keepaliveWorker = new Worker(timerWorkerScript, { name: 'VirtualBackground V2 keepalive' });
        this._keepaliveWorker.onmessage = async (response: MessageEvent) => {
            if (response.data.id === TIMEOUT_TICK && this._isRunning) {
                // Schedule next tick immediately so the interval is independent of how long _processFrame() takes.
                this._keepaliveWorker?.postMessage({ id: SET_TIMEOUT, timeMs: intervalMs });
                await this._processFrame();
            }
        };
        this._keepaliveWorker.postMessage({ id: SET_TIMEOUT, timeMs: intervalMs });
    }

    /**
     * Stops and terminates the keepalive worker timer.
     *
     * @private
     * @returns {void}
     */
    _stopKeepalive(): void {
        if (!this._keepaliveWorker) {
            return;
        }
        this._keepaliveWorker.postMessage({ id: CLEAR_TIMEOUT });
        this._keepaliveWorker.terminate();
        this._keepaliveWorker = null;
    }

    /**
     * Applies an exponential moving average (EMA) to the raw segmentation mask in-place.
     *
     * The GPU ping-pong in {@link WebGLCompositor} blends only two consecutive raw masks
     * ({@code mix(raw_N, raw_N-1, temporalRatio)}). An edge pixel that alternates 0/1 between
     * frames due to model uncertainty produces 0.15/0.85 blended values — both outside the
     * smoothstep interior — so the pixel still flickers at full amplitude.
     *
     * True EMA accumulates history across all frames: {@code acc = newWeight*raw + decay*acc}.
     * An alternating pixel converges to its mean (~0.5) within a few frames and stays there as a
     * stable semi-transparent value with no visible flicker.
     *
     * Uses a Float32 accumulator to avoid per-step quantization from Uint8ClampedArray rounding.
     * Modified in-place on the fresh {@code ImageData} returned by {@code toImageData()} each call.
     *
     * @private
     * @param {ImageData} maskData - Raw segmentation mask from {@code toImageData()}.
     * @returns {ImageData} The same ImageData with R and A channels replaced by the EMA value.
     */
    _applyMaskEMA(maskData: ImageData): ImageData {
        const n = maskData.width * maskData.height;
        const decay = this._temporalBlendRatio; // e.g. 0.85
        const newWeight = 1 - decay; // e.g. 0.15

        if (!this._maskAccumF32 || this._maskAccumF32.length !== n || this._firstMaskFrame) {
            // First frame or resolution change: seed accumulator from the raw mask.
            this._maskAccumF32 = new Float32Array(n);
            const raw = maskData.data;

            for (let i = 0, j = 0; i < n; i++, j += 4) {
                this._maskAccumF32[i] = raw[j]; // R = confidence * 255
            }

            return maskData; // Return raw values on first frame — no history to blend yet.
        }

        const raw = maskData.data;
        const acc = this._maskAccumF32;

        for (let i = 0, j = 0; i < n; i++, j += 4) {
            acc[i] = newWeight * raw[j] + decay * acc[i];
            raw[j] = acc[i]; // R — what the compositor shader reads as .r
            raw[j + 3] = acc[i]; // A — kept in sync
        }

        return maskData;
    }

    /**
     * Processes one video frame: runs segmentation, prepares the background, and composites the output.
     *
     * The {@code _processingFrame} flag prevents re-entrant calls — the WASM backend is
     * single-threaded and a second concurrent {@code segmentPeople} call corrupts the heap.
     *
     * The segmentation call runs inside an explicit TF.js memory scope
     * ({@code tf.engine().startScope()} / {@code endScope()}); tensors allocated
     * during the call are disposed when the scope ends. The mask is retrieved via
     * {@code toImageData()} (raw bytes, no premultiplied-alpha distortion), run through
     * {@link _applyMaskEMA} for true exponential temporal smoothing, then uploaded to the
     * compositor via {@link WebGLCompositor#compositeFromImageData}.
     *
     * @private
     * @returns {Promise<void>}
     */
    async _processFrame(): Promise<void> {
        // Drop this frame if the previous one is still being processed.
        // Prevents concurrent segmenter calls that corrupt WASM heap state.
        if (this._processingFrame || !this._isRunning) {
            return;
        }
        this._processingFrame = true;

        try {
            if (!this._inputVideoElement.readyState || this._inputVideoElement.readyState < 2) {
                return;
            }

            if (this._isPassthrough) {
                this._outputCanvasCtx?.drawImage(
                    this._inputVideoElement, 0, 0,
                    this._outputCanvasElement.width, this._outputCanvasElement.height
                );

                return;
            }

            if (!this._isReady || !this._workerReady) {
                return;
            }

            let maskData: ImageData | null = null;

            const frameStart = performance.now();

            // ORT (LOW tier) skip: run inference every N frames, reuse the cached mask in between.
            // For GPU tiers (MEDIUM/HIGH) the stride is always 1 — inference is fast enough.
            const stride = this._capabilities?.backend === BackendType.WASM
                ? (this._config.virtualBackground?.ortSkipStride ?? 2)
                : 1;
            const runInference = this._ortSkipCounter % stride === 0;

            this._ortSkipCounter++;

            if (runInference) {
                // All tiers: inference via VBInferenceWorker (ORT for LOW, TF.js for MEDIUM/HIGH).
                // createImageBitmap pre-scales the frame to the tier's seg resolution so the
                // worker transfers a smaller payload and skips internal model resize.
                try {
                    const { segWidth, segHeight } = this._capabilities!;
                    const bitmap = await createImageBitmap(this._inputVideoElement,
                        { resizeHeight: segHeight, resizeQuality: 'medium', resizeWidth: segWidth });

                    if (this._frameCount === 0) {
                        logger.debug('[VirtualBackground] First frame sent to inference worker');
                    }
                    const fresh = await this._inferWithWorker(bitmap);

                    if (fresh) {
                        this._cachedMaskData = fresh;
                    }
                } catch (err) {
                    logger.error('[VirtualBackground] Worker inference error', err);
                }
            }
            maskData = this._cachedMaskData;

            this._frameCount++;

            if (this._config.virtualBackground?.testMode) {
                this._benchmarkAccumTotal += performance.now() - frameStart;
                this._benchmarkFrameCount++;
                if (this._benchmarkFrameCount >= BENCHMARK_LOG_INTERVAL) {
                    this._logBenchmark();
                }
            }

            if (!maskData) {
                return;
            }

            const isStudioLight = this._options.backgroundType === VIRTUAL_BACKGROUND_TYPE.STUDIO_LIGHT;
            const maskBlurRadius = Math.round(
                TARGET_BLUR_CAMERA_PX * maskData.width / this._outputCanvasElement.width
            );

            if (isStudioLight) {
                // Studio light: apply lighting/beauty effects to person region, no background swap.
                if (this._compositor?.isStudioLightAvailable && this._webglCanvas) {
                    const opts = this._options.studioLightOptions ?? STUDIO_LIGHT_DEFAULTS;

                    this._compositor.compositeStudioLight(
                        this._inputVideoElement,
                        maskData,
                        0,
                        STUDIO_LIGHT_EDGE_LOW,
                        STUDIO_LIGHT_EDGE_HIGH,
                        this._firstMaskFrame,
                        maskBlurRadius,
                        opts.brightness ?? STUDIO_LIGHT_DEFAULTS.brightness,
                        opts.contrast ?? STUDIO_LIGHT_DEFAULTS.contrast,
                        opts.skinSmoothing ?? STUDIO_LIGHT_DEFAULTS.skinSmoothing,
                        opts.glowIntensity ?? STUDIO_LIGHT_DEFAULTS.glowIntensity,
                        opts.toneR ?? STUDIO_LIGHT_DEFAULTS.toneR,
                        opts.toneG ?? STUDIO_LIGHT_DEFAULTS.toneG,
                        opts.toneB ?? STUDIO_LIGHT_DEFAULTS.toneB,
                        opts.saturation ?? STUDIO_LIGHT_DEFAULTS.saturation,
                        opts.bgDimming ?? STUDIO_LIGHT_DEFAULTS.bgDimming
                    );
                    this._outputCanvasCtx?.drawImage(this._webglCanvas, 0, 0);
                } else {
                    this._compositeFallbackStudioLight(maskData);
                }
            } else {
                // --- Prepare background canvas ---
                this._prepareBackground();

                // --- Composite ---
                if (this._compositor?.isAvailable && this._webglCanvas) {
                    this._compositor.compositeFromImageData(
                        this._inputVideoElement,
                        this._backgroundCanvas,
                        maskData,
                        0,
                        this._edgeLow,
                        this._edgeHigh,
                        this._firstMaskFrame,
                        maskBlurRadius
                    );

                    // Blit the WebGL canvas to the output canvas. The output canvas
                    // has a 2D context (Firefox captureStream workaround) so WebGL
                    // cannot render directly to it. drawImage is GPU-accelerated and
                    // the cost is negligible.
                    this._outputCanvasCtx?.drawImage(this._webglCanvas, 0, 0);
                } else {
                    this._compositeFallback(maskData);
                }
            }

            // Must be cleared after compositing in BOTH the WebGL and Canvas 2D fallback branches.
            // If only cleared in the WebGL branch, a compositor failure keeps _firstMaskFrame=true
            // forever, which (a) suppresses ORT frame-skipping and (b) disables EMA smoothing.
            this._firstMaskFrame = false;
        } finally {
            this._processingFrame = false;
        }
    }

    /**
     * Renders the background (blur or image) onto the background canvas using Canvas 2D.
     * CSS blur is GPU-accelerated by the browser.
     *
     * @private
     * @param {CanvasImageSource} [source] - Camera frame source. Defaults to _inputVideoElement
     * (captureStream path). Pass a VideoFrame when called from the insertable streams path.
     * @returns {void}
     */
    _prepareBackground(source: CanvasImageSource = this._inputVideoElement): void {
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
     * Canvas 2D three-pass compositing fallback (same logic as V1).
     * Used when WebGL is unavailable.
     *
     * The mask {@code ImageData} is painted onto a persistent canvas via
     * {@code putImageData} — which writes raw bytes without premultiplied-alpha
     * conversion — and then scaled to the output dimensions with {@code drawImage}.
     *
     * @private
     * @param {ImageData | null} maskData - Segmentation mask, or null if no person detected.
     * @param {CanvasImageSource} [source] - Camera frame source. Defaults to _inputVideoElement
     * (captureStream path). Pass a VideoFrame when called from the insertable streams path.
     * @returns {void}
     */
    _compositeFallback(
            maskData: ImageData | null,
            source: CanvasImageSource = this._inputVideoElement): void {
        const ctx = this._outputCanvasCtx;

        if (!ctx) {
            return;
        }

        const { width, height } = this._outputCanvasElement;

        ctx.globalCompositeOperation = 'copy';

        if (maskData) {
            // Lazily create the mask canvas once and reuse every frame.
            if (!this._maskCanvas) {
                this._maskCanvas = document.createElement('canvas');
                this._maskCanvasCtx = this._maskCanvas.getContext('2d');
            }

            if (this._maskCanvas.width !== maskData.width || this._maskCanvas.height !== maskData.height) {
                this._maskCanvas.width = maskData.width;
                this._maskCanvas.height = maskData.height;
            }

            // putImageData writes raw bytes — no premultiplied-alpha distortion.
            this._maskCanvasCtx?.putImageData(maskData, 0, 0);

            ctx.filter = 'blur(4px)';
            ctx.drawImage(this._maskCanvas, 0, 0, width, height);
        } else {
            ctx.clearRect(0, 0, width, height);
        }

        // Clip foreground to mask
        ctx.globalCompositeOperation = 'source-in';
        ctx.filter = 'none';
        ctx.drawImage(source, 0, 0, width, height);

        // Draw background behind the person
        ctx.globalCompositeOperation = 'destination-over';
        ctx.drawImage(this._backgroundCanvas, 0, 0, width, height);
    }

    /**
     * Canvas 2D fallback for studio light mode (used when WebGL is unavailable).
     *
     * Applies brightness and contrast via CSS filter on the person-masked region.
     * Skin smoothing and glow are not available in Canvas 2D — this is acceptable
     * degradation for the LOW tier fallback path.
     *
     * @private
     * @param {ImageData | null} maskData - Segmentation mask.
     * @param {CanvasImageSource} [source] - Camera frame source.
     * @returns {void}
     */
    _compositeFallbackStudioLight(
            maskData: ImageData | null,
            source: CanvasImageSource = this._inputVideoElement): void {
        const ctx = this._outputCanvasCtx;

        if (!ctx) {
            return;
        }

        const { width, height } = this._outputCanvasElement;
        const opts = this._options.studioLightOptions ?? STUDIO_LIGHT_DEFAULTS;

        // Draw original frame as base.
        ctx.globalCompositeOperation = 'copy';
        ctx.filter = 'none';
        ctx.drawImage(source, 0, 0, width, height);

        if (!maskData) {
            return;
        }

        // Lazily create the mask canvas once and reuse every frame.
        if (!this._maskCanvas) {
            this._maskCanvas = document.createElement('canvas');
            this._maskCanvasCtx = this._maskCanvas.getContext('2d');
        }

        if (this._maskCanvas.width !== maskData.width || this._maskCanvas.height !== maskData.height) {
            this._maskCanvas.width = maskData.width;
            this._maskCanvas.height = maskData.height;
        }

        this._maskCanvasCtx?.putImageData(maskData, 0, 0);

        // Save state, clip to person region via mask, draw brightness/contrast adjusted frame.
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';

        // Draw mask as alpha channel.
        ctx.globalCompositeOperation = 'destination-in';
        ctx.filter = 'blur(4px)';
        ctx.drawImage(this._maskCanvas, 0, 0, width, height);

        // Now only the person region is visible. Draw the adjusted frame on top using source-atop
        // so it only affects the visible (person) area.
        ctx.globalCompositeOperation = 'source-atop';
        const brightnessVal = 1.0 + (opts.brightness ?? STUDIO_LIGHT_DEFAULTS.brightness);
        const contrastVal = opts.contrast ?? STUDIO_LIGHT_DEFAULTS.contrast;

        ctx.filter = `brightness(${brightnessVal}) contrast(${contrastVal})`;
        ctx.drawImage(source, 0, 0, width, height);

        // Restore background behind person.
        ctx.globalCompositeOperation = 'destination-over';
        ctx.filter = 'none';
        ctx.drawImage(source, 0, 0, width, height);
        ctx.restore();

        // Background dimming: overlay semi-transparent black on the entire frame, then
        // redraw the bright person region on top. This approximates the WebGL shader's
        // per-pixel (1 - bgDimming * (1 - alpha)) dimming.
        const bgDimming = opts.bgDimming ?? STUDIO_LIGHT_DEFAULTS.bgDimming;

        if (bgDimming > 0) {
            // Dim the whole frame.
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = `rgba(0,0,0,${bgDimming})`;
            ctx.fillRect(0, 0, width, height);

            // Punch person region back through via mask clip.
            ctx.globalCompositeOperation = 'destination-out';
            ctx.filter = 'blur(4px)';
            ctx.drawImage(this._maskCanvas, 0, 0, width, height);
            ctx.filter = 'none';

            // Fill person back in with the adjusted (bright) source.
            ctx.globalCompositeOperation = 'destination-over';
            ctx.filter = `brightness(${brightnessVal}) contrast(${contrastVal})`;
            ctx.drawImage(source, 0, 0, width, height);
            ctx.filter = 'none';
        }
    }

    /**
     * Logs accumulated benchmark data every {@link BENCHMARK_LOG_INTERVAL} frames and resets counters.
     *
     * Emits: model name, average inference time, average total frame time, rolling FPS, and JS heap
     * size (when available). Captured via console during Chrome DevTools benchmarking.
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
        const perfMem = (performance as any).memory;
        const heapMB = perfMem
            ? (perfMem.usedJSHeapSize / 1024 / 1024).toFixed(1)
            : 'N/A';

        const model = this._workerReady ? 'vb-worker' : 'unknown';

        logger.debug(
            `[VirtualBackground] BENCHMARK model=${model}`
            + ` avgTotal=${avgTotal}ms fps=${fps} heap=${heapMB}MB`
            + ` (frames ${this._frameCount - count + 1}-${this._frameCount})`
        );

        this._benchmarkAccumTotal = 0;
        this._benchmarkFrameCount = 0;
    }

    /**
     * Creates and initialises the VBInferenceWorker for MEDIUM / HIGH tier body-segmentation.
     *
     * The worker runs TF.js with an OffscreenCanvas-backed WebGL context in a dedicated thread.
     * Chrome's tab-visibility GPU scheduling throttle does not apply to Worker GPU contexts,
     * so inference continues at full frame rate when the main-document tab is hidden.
     *
     * Uses the same importScripts blob-URL pattern as FaceLandmarksDetector to load the
     * pre-built worker bundle from /libs/ without a separate module-worker instantiation.
     *
     * @private
     * @returns {Promise<void>} Resolves when the worker backend is ready for inference.
     */
    async _initInferenceWorker(): Promise<void> {
        // Ensure base URL always ends with '/' so path concatenation is correct regardless
        // of whether getBaseUrl() returns a trailing slash (varies by deployment).
        const base = getBaseUrl().replace(/\/?$/, '/');
        const workerUrl = `${base}libs/vb-inference-worker.min.js`;

        // Blob URL wrapper so the worker can call importScripts on the same origin.
        const blob = new Blob([ `importScripts("${workerUrl}");` ], { type: 'application/javascript' } as any);
        const blobUrl = URL.createObjectURL(blob);

        this._inferenceWorker = new Worker(blobUrl, { name: 'VB V2 Inference' });

        URL.revokeObjectURL(blobUrl);

        return new Promise<void>((resolve, reject) => {
            const handler = (e: MessageEvent) => {
                if (e.data.type === 'init_done') {
                    this._inferenceWorker?.removeEventListener('message', handler);
                    this._workerReady = true;
                    logger.debug('[VirtualBackground] Inference worker ready'
                        + ` (tier: ${this._capabilities?.tier})`);
                    resolve();
                } else if (e.data.type === 'init_error') {
                    this._inferenceWorker?.removeEventListener('message', handler);
                    reject(new Error(`Inference worker init error: ${e.data.error}`));
                }
            };

            this._inferenceWorker!.addEventListener('message', handler);
            this._inferenceWorker!.postMessage({
                backend: this._capabilities!.backend,
                modelPath: `${base}libs/pp_humanseg_192x192.onnx`,
                modelType: this._capabilities!.modelType,
                ortWasmPath: `${base}libs/`,
                segHeight: this._capabilities!.segHeight,
                segWidth: this._capabilities!.segWidth,
                type: 'init'
            });
        });
    }

    /**
     * Sends a pre-scaled ImageBitmap to the inference worker and awaits the mask result.
     *
     * The bitmap is transferred (zero-copy). The worker runs segmentation and returns the
     * raw mask Uint8ClampedArray (also transferred). The mask is wrapped in an ImageData and
     * passed through {@link _applyMaskEMA} before returning.
     *
     * Sequential call discipline: only one inference call is in flight at a time. The captureStream
     * path enforces this via {@code _processingFrame}; the IS path via its sequential read loop.
     *
     * @private
     * @param {ImageBitmap} bitmap - Pre-scaled camera frame at the tier's segmentation resolution.
     * @returns {Promise<ImageData | null>} EMA-smoothed mask, or null if inference failed.
     */
    _inferWithWorker(bitmap: ImageBitmap): Promise<ImageData | null> {
        return new Promise<ImageData | null>(resolve => {
            if (!this._inferenceWorker || !this._workerReady) {
                bitmap.close();
                resolve(null);

                return;
            }

            const handler = (e: MessageEvent) => {
                if (e.data.type === 'mask') {
                    this._inferenceWorker?.removeEventListener('message', handler);
                    const imgData = new ImageData(e.data.data as Uint8ClampedArray,
                        e.data.width as number, e.data.height as number);

                    resolve(this._applyMaskEMA(imgData));
                } else if (e.data.type === 'infer_error') {
                    this._inferenceWorker?.removeEventListener('message', handler);
                    logger.warn('[VirtualBackground] Worker inference error:', e.data.error);
                    resolve(null);
                }
            };

            this._inferenceWorker.addEventListener('message', handler);
            this._inferenceWorker.postMessage({ bitmap, type: 'infer' }, [ bitmap as unknown as Transferable ]);
        });
    }

    /**
     * Returns true when the insertable streams API should be used for frame processing.
     *
     * IS is the default path when the browser supports MediaStreamTrackProcessor and
     * MediaStreamTrackGenerator. Set config.virtualBackground.useInsertableStreams=false
     * to force the legacy captureStream path instead.
     *
     * @private
     * @returns {boolean}
     */
    _shouldUseInsertableStreams(): boolean {
        if (this._config.virtualBackground?.useInsertableStreams === false) {
            return false;
        }

        return 'MediaStreamTrackProcessor' in window && 'MediaStreamTrackGenerator' in window;
    }

    /**
     * Drives frame processing via the Insertable Streams API.
     *
     * Reads VideoFrame objects from _trackProcessor, transforms them with _processFrameIS(), and writes the result to
     * _trackGenerator. No requestVideoFrameCallback or keepalive Worker is needed — the ReadableStream delivers frames
     * directly from the camera regardless of tab visibility.
     *
     * @private
     * @returns {Promise<void>}
     */
    async _runInsertableStreamsLoop(): Promise<void> {
        if (this._isLoopStarted) {
            return;
        }

        const processor = this._trackProcessor;
        const generator = this._trackGenerator;

        if (!processor || !generator) {
            return;
        }

        this._isLoopStarted = true;

        const reader = processor.readable.getReader();

        // Expose the reader so stopEffect() can cancel it immediately, causing the pending
        // reader.read() to reject and the loop to exit without waiting for the next camera frame.
        this._trackReader = reader;
        const writer = generator.writable.getWriter();

        try {
            while (this._isRunning) {
                const { value: frame, done } = await reader.read();

                if (done || !frame) {
                    break;
                }

                if (!this._isReady || !this._workerReady || this._isPassthrough) {
                    try {
                        await writer.write(frame);
                    } catch (err) {
                        logger.error('[VirtualBackground] IS write error', err);
                    }
                    frame.close();
                    continue;
                }

                let processed: VideoFrame | null = null;

                try {
                    processed = await this._processFrameIS(frame);
                } catch (err) {
                    logger.error('[VirtualBackground] IS frame processing error', err);
                }

                frame.close();

                if (processed) {
                    try {
                        await writer.write(processed);
                    } catch (err) {
                        logger.error('[VirtualBackground] IS write error', err);
                    }
                    processed.close();
                }
            }
        } catch (err) {
            // When stopEffect() cancels the reader, reader.read() rejects — that is expected.
            // Only log genuine errors that occur while the loop is supposed to be running.
            if (this._isRunning) {
                logger.error('[VirtualBackground] IS loop error', err);
            }
        } finally {
            this._trackReader = null;
            this._isLoopStarted = false;

            // Cancel reader to flush any VideoFrames still buffered in the processor's queue.
            // reader.cancel() also releases the reader's lock per the Streams spec.
            try {
                await reader.cancel();
            } catch { /* ignore — may have already been cancelled by stopEffect() */ }

            writer.releaseLock();
        }
    }

    /**
     * Processes one VideoFrame via the insertable streams path.
     *
     * Draws the incoming VideoFrame synchronously to a persistent pre-scaled canvas ({@code _segInputCanvas}) and
     * passes that canvas to the segmenter. This is significantly faster than the previous approach of calling the
     * async {@code createImageBitmap(frame)} at full resolution — it eliminates the Promise overhead and lets TF.js
     * skip its internal full-resolution resize step (the single largest per-frame cost in the IS path).
     *
     * The VideoFrame is passed directly as {@code TexImageSource} to {@link WebGLCompositor#compositeFromImageData}
     * for the camera texture upload and as {@code CanvasImageSource} to {@link _prepareBackground} for blur — no
     * full-resolution ImageBitmap is created. The original frame timestamp is preserved in the output VideoFrame so
     * downstream encoders maintain correct A/V synchronisation.
     *
     * @private
     * @param {VideoFrame} frame - Raw camera VideoFrame from MediaStreamTrackProcessor.
     * @returns {Promise<VideoFrame>} Composited output frame ready to write to MediaStreamTrackGenerator.
     */
    async _processFrameIS(frame: VideoFrame): Promise<VideoFrame> {
        let maskData: ImageData | null = null;
        const frameStart = performance.now();

        // ORT (LOW tier) skip: run inference every N frames, reuse the cached mask in between.
        // For GPU tiers (MEDIUM/HIGH) the stride is always 1 — inference is fast enough.
        const stride = this._capabilities?.backend === BackendType.WASM
            ? (this._config.virtualBackground?.ortSkipStride ?? 2)
            : 1;
        const runInference = this._workerReady && (this._ortSkipCounter % stride === 0);

        this._ortSkipCounter++;

        if (runInference) {
            // All tiers: inference in VBInferenceWorker (Worker thread).
            // createImageBitmap with resizeWidth/Height pre-scales the VideoFrame to the tier's
            // seg resolution before transferring — reduces transfer payload and skips TF.js resize.
            try {
                const { segWidth, segHeight } = this._capabilities!;
                const bitmap = await createImageBitmap(frame,
                    { resizeHeight: segHeight, resizeQuality: 'medium', resizeWidth: segWidth });

                const fresh = await this._inferWithWorker(bitmap);

                if (fresh) {
                    this._cachedMaskData = fresh;
                }
            } catch (err) {
                logger.error('[VirtualBackground] IS worker inference error', err);
            }
        }
        maskData = this._cachedMaskData;

        this._frameCount++;

        if (this._config.virtualBackground?.testMode) {
            this._benchmarkAccumTotal += performance.now() - frameStart;
            this._benchmarkFrameCount++;
            if (this._benchmarkFrameCount >= BENCHMARK_LOG_INTERVAL) {
                this._logBenchmark();
            }
        }

        const isStudioLight = this._options.backgroundType === VIRTUAL_BACKGROUND_TYPE.STUDIO_LIGHT;

        if (maskData) {
            const maskBlurRadius = Math.round(
                TARGET_BLUR_CAMERA_PX * maskData.width / this._outputCanvasElement.width);

            if (isStudioLight) {
                if (this._compositor?.isStudioLightAvailable && this._webglCanvas) {
                    const opts = this._options.studioLightOptions ?? STUDIO_LIGHT_DEFAULTS;

                    this._compositor.compositeStudioLight(
                        frame,
                        maskData,
                        0,
                        STUDIO_LIGHT_EDGE_LOW,
                        STUDIO_LIGHT_EDGE_HIGH,
                        this._firstMaskFrame,
                        maskBlurRadius,
                        opts.brightness ?? STUDIO_LIGHT_DEFAULTS.brightness,
                        opts.contrast ?? STUDIO_LIGHT_DEFAULTS.contrast,
                        opts.skinSmoothing ?? STUDIO_LIGHT_DEFAULTS.skinSmoothing,
                        opts.glowIntensity ?? STUDIO_LIGHT_DEFAULTS.glowIntensity,
                        opts.toneR ?? STUDIO_LIGHT_DEFAULTS.toneR,
                        opts.toneG ?? STUDIO_LIGHT_DEFAULTS.toneG,
                        opts.toneB ?? STUDIO_LIGHT_DEFAULTS.toneB,
                        opts.saturation ?? STUDIO_LIGHT_DEFAULTS.saturation,
                        opts.bgDimming ?? STUDIO_LIGHT_DEFAULTS.bgDimming
                    );
                    this._firstMaskFrame = false;

                    return new VideoFrame(this._webglCanvas, { timestamp: frame.timestamp });
                }

                this._compositeFallbackStudioLight(maskData, frame);
                this._firstMaskFrame = false;

                return new VideoFrame(this._outputCanvasElement, { timestamp: frame.timestamp });
            }

            // Virtual background path.
            // VideoFrame is CanvasImageSource — pass directly (no ImageBitmap needed).
            this._prepareBackground(frame);

            if (this._compositor?.isAvailable && this._webglCanvas) {
                this._compositor.compositeFromImageData(
                    frame,
                    this._backgroundCanvas,
                    maskData,
                    0,
                    this._edgeLow,
                    this._edgeHigh,
                    this._firstMaskFrame,
                    maskBlurRadius
                );
                this._firstMaskFrame = false;

                return new VideoFrame(this._webglCanvas, { timestamp: frame.timestamp });
            }
        } else {
            // No mask yet — prepare background for VB passthrough (not needed for studio light).
            if (!isStudioLight) {
                this._prepareBackground(frame);
            }
        }

        // Canvas 2D fallback — VideoFrame is CanvasImageSource for drawImage.
        // Also handles null mask (shows background only).
        if (isStudioLight) {
            this._compositeFallbackStudioLight(maskData, frame);
        } else {
            this._compositeFallback(maskData, frame);
        }

        // Must be cleared in the fallback path too. Leaving it true would permanently
        // suppress EMA smoothing if the compositor is unavailable.
        if (maskData) {
            this._firstMaskFrame = false;
        }

        return new VideoFrame(this._outputCanvasElement, { timestamp: frame.timestamp });
    }
}
