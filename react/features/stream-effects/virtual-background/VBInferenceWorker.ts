/**
 * Virtual Background V2 — inference worker.
 *
 * Handles TF.js body-segmentation (MEDIUM/HIGH tiers via WebGL/WebGPU) and ORT WASM
 * (LOW tier via PP-HumanSeg FP32) in a single dedicated Web Worker. Running all inference
 * in a Worker keeps the main thread free for UI events. For GPU tiers, the Worker's
 * OffscreenCanvas-backed WebGL context is not subject to Chrome's tab-visibility GPU
 * scheduling throttle.
 */
/*
 * Message protocol
 *
 *   Main -> Worker:
 *     { type: 'init', backend: string, modelType: string, segWidth: number, segHeight: number,
 *       modelPath?: string, ortWasmPath?: string }
 *     { type: 'infer', bitmap: ImageBitmap }   (bitmap is transferred -- zero-copy)
 *     { type: 'stop' }
 *
 *   Worker -> Main:
 *     { type: 'init_done' }
 *     { type: 'init_error', error: string }
 *     { type: 'mask', data: Uint8ClampedArray, width: number, height: number }
 *       (data.buffer is transferred -- zero-copy)
 *     { type: 'infer_error', error: string }
 */

import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-webgpu';
import * as tf from '@tensorflow/tfjs-core';
import type { BodySegmenter, MediaPipeSelfieSegmentationTfjsModelConfig }
    from '@tensorflow-models/body-segmentation';
import * as bs from '@tensorflow-models/body-segmentation';

import { BackendType } from './DeviceTierDetector.web';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Maximum segmentation dimension in pixels. Guards against OOM via crafted init messages. */
const MAX_SEG_DIMENSION = 2048;

/**
 * Extracts the effective origin of this Worker script.
 *
 * Workers loaded via a blob URL have self.location.href of the form
 * "blob:https://hostname/uuid". Standard URL parsing returns origin="null" for blob URLs,
 * so we strip the "blob:" prefix and parse the embedded URL to recover the real origin.
 *
 * @returns {string} The origin (e.g. "https://meet.example.com"), or empty string if unparseable.
 */
function getWorkerOrigin(): string {
    try {
        const { href } = self.location;

        return new URL(href.startsWith('blob:') ? href.slice(5) : href).origin;
    } catch {
        return '';
    }
}

/**
 * Returns true when {@code url} is a valid http/https URL at the same origin as this Worker.
 * Rejects data URIs, javascript: URLs, file: URLs, and cross-origin paths.
 *
 * @param {string} url - URL to validate.
 * @returns {boolean}
 */
function isSameOriginUrl(url: string): boolean {
    try {
        const parsed = new URL(url);

        return (parsed.protocol === 'https:' || parsed.protocol === 'http:')
            && parsed.origin === getWorkerOrigin();
    } catch {
        return false;
    }
}

/** Active TF.js segmenter (MEDIUM/HIGH tiers). Null when using ORT backend. */
let segmenter: BodySegmenter | null = null;

/** Active ORT inference session (LOW tier). Null when using TF.js backend. */
let ortSession: any = null;

/** ORT module reference — needed to construct Tensor objects at inference time. */
let ortModule: any = null;

/** Pre-allocated NCHW float32 input buffer — reused every frame to avoid GC pressure. */
let ortInputBuffer: Float32Array | null = null;

/** Total pixel count for the ORT segmentation canvas (segWidth x segHeight). */
let ortPixelCount = 0;

/** ORT segmentation canvas width (from init message). */
let ortSegWidth = 0;

/** ORT segmentation canvas height (from init message). */
let ortSegHeight = 0;

/** OffscreenCanvas for downscaling frames before ORT inference. */
let ortReadCanvas: any = null;

/** 2D rendering context for ortReadCanvas. */
let ortReadCtx: any = null;

/** Active backend type. WASM selects ORT; WEBGL or WEBGPU selects TF.js. Empty when stopped. */
let currentBackend: BackendType | '' = '';

/**
 * Type-safe postMessage wrapper for DedicatedWorkerGlobalScope.
 * TypeScript types the global 'self' as Window (lib.dom) which has a different postMessage
 * signature to DedicatedWorkerGlobalScope. Casting through 'any' bypasses the mismatch.
 *
 * @param {any} msg - Structured-cloneable message payload.
 * @param {Transferable[]} [transfer] - Optional list of transferable objects (zero-copy).
 * @returns {void}
 */
function workerPost(msg: any, transfer?: Transferable[]): void {
    if (transfer?.length) {
        (self as any).postMessage(msg, transfer);
    } else {
        (self as any).postMessage(msg);
    }
}

// onmessage at module scope — runs in DedicatedWorkerGlobalScope after importScripts loads this bundle.
// TypeScript types 'onmessage' as Window.onmessage, but the runtime target is the worker global.
(self as any).onmessage = async (e: MessageEvent) => {
    const { type } = e.data;

    if (type === 'init') {
        await handleInit(e.data);
    } else if (type === 'infer') {
        await handleInfer(e.data.bitmap as ImageBitmap);
    } else if (type === 'stop') {
        handleStop();
    }
};

/**
 * Initialises the worker backend based on the tier signalled by the main thread.
 *
 * Routes to the ORT WASM handler for LOW tier (backend 'wasm') or the TF.js handler
 * for MEDIUM/HIGH tiers (backend 'webgl' or 'webgpu').
 *
 * @param {Object} data - Init message payload.
 * @param {string} data.backend - 'webgl', 'webgpu', or 'wasm'.
 * @param {string} [data.modelPath] - Absolute URL of the ONNX model (WASM tier only).
 * @param {string} data.modelType - 'general' or 'landscape' (TF.js tiers only).
 * @param {string} [data.ortWasmPath] - Base URL for ORT WASM binaries (WASM tier only).
 * @param {number} data.segHeight - Segmentation canvas height.
 * @param {number} data.segWidth - Segmentation canvas width.
 * @returns {Promise<void>}
 */
async function handleInit(data: {
    backend: BackendType;
    modelPath?: string;
    modelType: string;
    ortWasmPath?: string;
    segHeight: number;
    segWidth: number;
}): Promise<void> {
    // Whitelist backend — rejects unknown values before they reach tf.setBackend() or ORT.
    if (data.backend !== BackendType.WASM
            && data.backend !== BackendType.WEBGL
            && data.backend !== BackendType.WEBGPU) {
        workerPost({ error: `Unknown backend: "${data.backend}"`, type: 'init_error' });

        return;
    }

    // Bounds-check dimensions — prevents OOM from crafted init messages.
    if (!Number.isInteger(data.segWidth) || data.segWidth < 1 || data.segWidth > MAX_SEG_DIMENSION
            || !Number.isInteger(data.segHeight) || data.segHeight < 1
            || data.segHeight > MAX_SEG_DIMENSION) {
        workerPost({ error: 'Invalid segmentation dimensions in init message', type: 'init_error' });

        return;
    }

    currentBackend = data.backend;

    if (data.backend === BackendType.WASM) {
        await handleInitOrt(data as {
            modelPath: string;
            ortWasmPath: string;
            segHeight: number;
            segWidth: number;
        });
    } else {
        await handleInitTfjs(data);
    }
}

/**
 * Initialises TF.js with the tier-appropriate backend and creates the body-segmentation model.
 * In a Worker, TF.js automatically uses OffscreenCanvas for its WebGL context (document is
 * unavailable). Chrome does not apply tab-visibility GPU throttling to Worker GPU contexts.
 *
 * @param {Object} data - Init message payload.
 * @param {string} data.backend - 'webgl' (MEDIUM tier) or 'webgpu' (HIGH tier).
 * @param {string} data.modelType - 'general' or 'landscape'.
 * @param {number} data.segWidth - Unused here; inference at bitmap resolution.
 * @param {number} data.segHeight - Unused here; inference at bitmap resolution.
 * @returns {Promise<void>}
 */
async function handleInitTfjs(data: {
    backend: string;
    modelType: string;
    segHeight: number;
    segWidth: number;
}): Promise<void> {
    try {
        const { backend, modelType } = data;

        const backendSet = await tf.setBackend(backend);

        await tf.ready();

        if (!backendSet || tf.getBackend() !== backend) {
            workerPost({
                error: `Backend "${backend}" unavailable — active: "${tf.getBackend()}"`,
                type: 'init_error'
            });

            return;
        }

        segmenter = await bs.createSegmenter(
            bs.SupportedModels.MediaPipeSelfieSegmentation,
            { modelType, runtime: 'tfjs' } as MediaPipeSelfieSegmentationTfjsModelConfig
        );

        workerPost({ type: 'init_done' });
    } catch (err) {
        workerPost({ error: String(err), type: 'init_error' });
    }
}

/**
 * Initialises the ORT WASM backend for LOW tier using PP-HumanSeg FP32.
 *
 * Loads onnxruntime-web dynamically and configures single-threaded WASM execution
 * (numThreads=1 avoids SharedArrayBuffer / COOP-COEP header requirements). Creates
 * an ORT InferenceSession from the provided model URL, pre-allocates an OffscreenCanvas
 * for pixel readback, and a NCHW float32 input buffer that is reused every frame.
 *
 * @param {Object} data - Init message payload for the WASM tier.
 * @param {string} data.modelPath - Absolute URL of the PP-HumanSeg ONNX model.
 * @param {string} data.ortWasmPath - Base URL for ORT WASM binaries (ort-wasm*.wasm).
 * @param {number} data.segHeight - Segmentation canvas height.
 * @param {number} data.segWidth - Segmentation canvas width.
 * @returns {Promise<void>}
 */
async function handleInitOrt(data: {
    modelPath: string;
    ortWasmPath: string;
    segHeight: number;
    segWidth: number;
}): Promise<void> {
    try {
        const { modelPath, ortWasmPath, segHeight, segWidth } = data;

        // Validate URLs are same-origin — prevents loading model/WASM binaries from external servers.
        if (!isSameOriginUrl(modelPath) || !isSameOriginUrl(ortWasmPath)) {
            workerPost({ error: 'Model or WASM path must be same-origin', type: 'init_error' });

            return;
        }

        // onnxruntime-web v1.17 uses `document` as a bare global in its Emscripten bootstrap
        // (WASM path resolution, WebGL detection, dynamic <script> injection). Workers lack
        // `document`, so any access throws ReferenceError. Static stubs fail because ORT
        // accesses document through unpredictable property chains that vary by code path.
        //
        // Fix: install a Proxy-based recursive "DOM node" factory before the dynamic import.
        // makeNode() returns a Proxy whose target is a no-op function (so the proxy itself is
        // callable). Unknown property accesses return another makeNode(), so any chain of the
        // form doc.head.parentNode.childNodes[0].appendChild(el) is silently absorbed.
        //
        // Known-value overrides on the document proxy:
        //   createElement('canvas') → OffscreenCanvas  (WebGL check; getContext returns null)
        //   getElementsByTagName('script') → {length:0} (skip script-URL detection; wasmPaths wins)
        //   currentScript → null
        //   readyState    → 'complete'
        //   everything else → makeNode()  (head, body, getElementById, etc.)
        // ORT's Emscripten bootstrap accesses several Node.js / browser globals that are absent
        // in DedicatedWorkerGlobalScope. Polyfill them before the dynamic import so that ORT
        // module-level code (which runs inside the import() call with eager mode) does not throw.
        //
        //   window      — not defined in Workers; alias self so window.x chains resolve.
        //   __filename  — Node.js global; ORT may read it via new Function / eval outside
        //                 webpack's module wrapper (where webpack's own polyfill does not apply).
        //   __dirname   — paired with __filename in Node.js idioms.
        if (typeof window === 'undefined') {
            (self as any).window = self;
        }
        if (typeof (self as any).__filename === 'undefined') {
            (self as any).__filename = 'vb-inference-worker.js';
        }
        if (typeof (self as any).__dirname === 'undefined') {
            (self as any).__dirname = '/';
        }

        if (typeof document === 'undefined') {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            const makeNode = (): any => new Proxy(
                // Function target makes the proxy itself callable (e.g. addEventListener callbacks).
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                // eslint-disable-next-line func-style
                (function nodeStub() {
                    return makeNode();
                }) as any,
                {
                    apply: () => makeNode(),
                    get: (_t: any, prop: string) => {
                        if (prop === 'length') {
                            return 0;
                        }
                        if (prop === 'getAttribute') {
                            return () => null;
                        }
                        if (prop === 'setAttribute'
                                || prop === 'removeAttribute'
                                || prop === 'appendChild'
                                || prop === 'removeChild'
                                || prop === 'insertBefore') {
                            return () => undefined;
                        }
                        if (prop === 'addEventListener') {
                            return () => undefined;
                        }
                        if (prop === 'src' || prop === 'href' || prop === 'type') {
                            return '';
                        }

                        return makeNode();
                    }
                }
            );

            (self as any).document = new Proxy(
                {} as any,
                {
                    get: (_t: any, prop: string) => {
                        if (prop === 'createElement') {
                            return (tag: string) => (
                                tag === 'canvas' ? new OffscreenCanvas(1, 1) : makeNode()
                            );
                        }
                        if (prop === 'getElementsByTagName') {
                            // Return empty list for 'script' — ORT skips URL detection and
                            // uses wasmPaths instead. Other tags return a safe node.
                            return (tag: string) => (tag === 'script' ? { length: 0 } : makeNode());
                        }
                        if (prop === 'currentScript') {
                            return null;
                        }
                        if (prop === 'readyState') {
                            return 'complete';
                        }

                        return makeNode();
                    }
                }
            );
        }

        // webpackMode:"eager" inlines onnxruntime-web directly into this bundle instead of
        // splitting it into a separate chunk. Without this, webpack generates an importScripts()
        // call for the ORT chunk. In a blob-URL Worker, importScripts() executes the chunk script
        // synchronously and any module-level throw (e.g. `window` / `document` access before our
        // polyfills) surfaces only as a generic ChunkLoadError, masking the real cause. With
        // eager mode the module code runs inline inside the import() call, after our polyfills are
        // installed, and any error propagates as-is without the chunk-loading wrapper.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        ortModule = await import(/* webpackChunkName: "ort-eager" */ /* webpackMode: "eager" */ 'onnxruntime-web');
        ortModule.env.wasm.numThreads = 1;
        ortModule.env.wasm.wasmPaths = ortWasmPath;

        ortSession = await ortModule.InferenceSession.create(modelPath, {
            executionMode: 'sequential',
            executionProviders: [ 'wasm' ],
            graphOptimizationLevel: 'all'
        });

        ortSegWidth = segWidth;
        ortSegHeight = segHeight;
        ortPixelCount = segWidth * segHeight;
        ortInputBuffer = new Float32Array(3 * ortPixelCount);

        // OffscreenCanvas is the worker-side equivalent of document.createElement('canvas').
        ortReadCanvas = new OffscreenCanvas(segWidth, segHeight);
        ortReadCtx = ortReadCanvas.getContext('2d', { willReadFrequently: true });

        workerPost({ type: 'init_done' });
    } catch (err) {
        workerPost({ error: String(err), type: 'init_error' });
    }
}

/**
 * Dispatches an inference call to the TF.js or ORT handler based on the active backend.
 *
 * @param {ImageBitmap} bitmap - Pre-scaled camera frame at the tier's segmentation resolution.
 * @returns {Promise<void>}
 */
async function handleInfer(bitmap: ImageBitmap): Promise<void> {
    if (currentBackend === BackendType.WASM) {
        await handleInferOrt(bitmap);
    } else {
        await handleInferTfjs(bitmap);
    }
}

/**
 * Runs one TF.js inference cycle on the transferred ImageBitmap.
 *
 * The bitmap is at the tier's segmentation resolution (pre-scaled on the main thread via
 * createImageBitmap resize options). TF.js skips its own internal resize, reducing per-frame cost.
 * The raw mask Uint8ClampedArray is transferred back (zero-copy) for EMA smoothing and WebGL
 * compositing on the main thread.
 *
 * @param {ImageBitmap} bitmap - Pre-scaled camera frame at seg resolution.
 * @returns {Promise<void>}
 */
async function handleInferTfjs(bitmap: ImageBitmap): Promise<void> {
    if (!segmenter) {
        bitmap.close();
        workerPost({ error: 'Segmenter not initialised', type: 'infer_error' });

        return;
    }

    tf.engine().startScope();
    try {
        const segmentations = await segmenter.segmentPeople(
            bitmap as unknown as HTMLImageElement, { flipHorizontal: false }
        );

        if (!segmentations.length) {
            workerPost({ error: 'No segmentation result', type: 'infer_error' });

            return;
        }

        const maskData = await segmentations[0].mask.toImageData();
        const data = maskData.data;

        // Transfer the backing ArrayBuffer — zero-copy, data becomes detached in this worker.
        workerPost(
            { data, height: maskData.height, type: 'mask', width: maskData.width },
            [ data.buffer as ArrayBuffer ]
        );
    } catch (err) {
        workerPost({ error: String(err), type: 'infer_error' });
    } finally {
        // Close unconditionally — called in finally so the bitmap is always released
        // even when segmentPeople() throws before the try-block close is reached.
        bitmap.close();
        tf.engine().endScope();
    }
}

/**
 * Runs one ORT WASM inference cycle on the transferred ImageBitmap.
 *
 * Downscales the bitmap via OffscreenCanvas, builds a NCHW float32 input tensor with RGB
 * channels normalised to [-1,1] (PP-HumanSeg OpenCV zoo convention), runs the ORT session,
 * and returns a Uint8ClampedArray with person confidence in the R and A channels.
 * EMA temporal smoothing is deferred to the main thread so all tiers share the same path.
 *
 * @param {ImageBitmap} bitmap - Pre-scaled camera frame at seg resolution.
 * @returns {Promise<void>}
 */
async function handleInferOrt(bitmap: ImageBitmap): Promise<void> {
    if (!ortSession || !ortModule || !ortReadCtx || !ortInputBuffer) {
        bitmap.close();
        workerPost({ error: 'ORT not initialised', type: 'infer_error' });

        return;
    }

    try {
        // 1. Draw bitmap to OffscreenCanvas and read RGBA pixels.
        ortReadCtx.drawImage(bitmap, 0, 0, ortSegWidth, ortSegHeight);
        const imageData = ortReadCtx.getImageData(0, 0, ortSegWidth, ortSegHeight);

        // 2. Build NCHW float32 input: [1, 3, H, W], RGB channel order, normalised to [-1,1].
        // PP-HumanSeg (OpenCV zoo) expects RGB with (pixel / 128 - 1) normalisation.
        const buf = ortInputBuffer;
        const pixelCount = ortPixelCount;

        for (let i = 0; i < pixelCount; i++) {
            buf[i] = imageData.data[i * 4] / 128 - 1;
            buf[pixelCount + i] = imageData.data[i * 4 + 1] / 128 - 1;
            buf[pixelCount * 2 + i] = imageData.data[i * 4 + 2] / 128 - 1;
        }

        // 3. Run ORT inference (async — resolves after WASM completes in the Worker thread).
        // The input tensor wraps a WASM-backed copy of buf; dispose() frees it after run().
        const inputName = ortSession.inputNames[0];
        const inputTensor = new ortModule.Tensor('float32', buf, [ 1, 3, ortSegHeight, ortSegWidth ]);
        const results = await ortSession.run({ [inputName]: inputTensor });

        inputTensor.dispose?.();

        // 4. Extract person confidence from NCHW output [1, 2, H, W].
        // Person channel is at index pixelCount+i (channel 1). PP-HumanSeg includes Softmax
        // in the ONNX graph, so values are already [0,1] probabilities.
        // R channel: read by the WebGL compositor shader (u_mask sampler reads .r).
        // A channel: used by the Canvas 2D fallback compositing path.
        // outputTensor.data is a view into the WASM heap — read all values before dispose().
        const outputTensor = results[ortSession.outputNames[0]];
        const outputData = outputTensor.data as Float32Array;
        const maskBytes = new Uint8ClampedArray(pixelCount * 4);

        for (let i = 0; i < pixelCount; i++) {
            const v = Math.round(outputData[pixelCount + i] * 255);

            maskBytes[i * 4] = v;
            maskBytes[i * 4 + 3] = v;
        }

        outputTensor.dispose?.();

        workerPost(
            { data: maskBytes, height: ortSegHeight, type: 'mask', width: ortSegWidth },
            [ maskBytes.buffer ]
        );
    } catch (err) {
        workerPost({ error: String(err), type: 'infer_error' });
    } finally {
        // Close unconditionally — ensures the bitmap is always released even if drawImage throws.
        bitmap.close();
    }
}

/**
 * Disposes all backend resources and resets state.
 *
 * @returns {void}
 */
function handleStop(): void {
    segmenter?.dispose();
    segmenter = null;

    // ORT: InferenceSession has no release() in onnxruntime-web 1.17; null refs allow GC.
    ortSession = null;
    ortModule = null;
    ortInputBuffer = null;
    ortReadCanvas = null;
    ortReadCtx = null;

    currentBackend = '';
}
