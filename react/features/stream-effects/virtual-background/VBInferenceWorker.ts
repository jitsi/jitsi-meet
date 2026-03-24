/**
 * Virtual Background V2 — inference worker.
 *
 * Handles TF.js body-segmentation (MEDIUM/HIGH tiers via WebGL/WebGPU) and TFLite WASM
 * (LOW tier via ML Kit Selfie Segmentation FP16) in a single dedicated Web Worker. Running
 * all inference in a Worker keeps the main thread free for UI events. For GPU tiers, the
 * Worker's OffscreenCanvas-backed WebGL context is not subject to Chrome's tab-visibility
 * GPU scheduling throttle.
 */
/*
 * Message protocol
 *
 *   Main -> Worker:
 *     { type: 'init', backend: string, modelType: string, segWidth: number, segHeight: number,
 *       tfliteModelPath: string, tfliteWasmBase: string }
 *     { type: 'infer', bitmap: ImageBitmap }   (bitmap is transferred -- zero-copy)
 *     { type: 'stop' }
 *
 *   Worker -> Main:
 *     { type: 'init_done', backend: string, segHeight: number, segWidth: number }
 *       backend/segHeight/segWidth reflect the actual tier used (may differ from requested
 *       backend when the Worker fell back to TFLite because the GPU backend was unavailable)
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
/* eslint-disable lines-around-comment */
// @ts-ignore
import createTFLiteModule from './vendor/tflite/tflite';
// @ts-ignore
import createTFLiteSIMDModule from './vendor/tflite/tflite-simd';
/* eslint-enable lines-around-comment */

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

/** Active TF.js segmenter (MEDIUM/HIGH tiers). Null when using TFLite backend. */
let segmenter: BodySegmenter | null = null;

/** Active TFLite module (LOW tier, TFLITE backend). Null when using TF.js. */
let tfliteModule: any = null;

/** TFLite input HEAPF32 offset (byte offset / 4). Pre-computed after model load. */
let tfliteInputOffset = 0;

/** TFLite output HEAPF32 offset (byte offset / 4). Pre-computed after model load. */
let tfliteOutputOffset = 0;

/** TFLite segmentation pixel count (segWidth x segHeight). */
let tflitePixelCount = 0;

/** TFLite segmentation canvas width. */
let tfliteSegWidth = 0;

/** TFLite segmentation canvas height. */
let tfliteSegHeight = 0;

/** OffscreenCanvas for downscaling frames before TFLite inference. */
let tfliteReadCanvas: any = null;

/** 2D context for tfliteReadCanvas. */
let tfliteReadCtx: any = null;

/** Active backend type. TFLITE selects TFLite WASM; WEBGL/WEBGPU selects TF.js. */
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
 * Routes to the TFLite handler for LOW tier (backend 'tflite') or the TF.js handler for
 * MEDIUM/HIGH tiers (backend 'webgl' or 'webgpu'). The TFLite model path and WASM base are
 * always passed so the TF.js handler can fall back to TFLite if GPU init fails in the Worker.
 *
 * @param {Object} data - Init message payload.
 * @param {string} data.backend - 'tflite', 'webgl', or 'webgpu'.
 * @param {string} data.modelType - 'general' or 'landscape' (TF.js tiers only).
 * @param {number} data.segHeight - Segmentation canvas height.
 * @param {number} data.segWidth - Segmentation canvas width.
 * @param {string} data.tfliteModelPath - Absolute URL of the ML Kit TFLite model.
 * @param {string} data.tfliteWasmBase - Base URL for tflite*.wasm binaries (trailing slash).
 * @returns {Promise<void>}
 */
async function handleInit(data: {
    backend: BackendType;
    modelType: string;
    segHeight: number;
    segWidth: number;
    tfliteModelPath: string;
    tfliteWasmBase: string;
}): Promise<void> {
    // Whitelist backend — rejects unknown values before they reach tf.setBackend() or TFLite.
    if (data.backend !== BackendType.TFLITE
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

    if (data.backend === BackendType.TFLITE) {
        await handleInitTflite(data);
    } else {
        await handleInitTfjs(data);
    }
}

/**
 * Initialises TF.js with the tier-appropriate backend and creates the body-segmentation model.
 * In a Worker, TF.js automatically uses OffscreenCanvas for its WebGL context (document is
 * unavailable). Chrome does not apply tab-visibility GPU throttling to Worker GPU contexts.
 *
 * If the requested GPU backend is unavailable (no GPU, OffscreenCanvas WebGL unsupported, etc.),
 * falls back to TFLite WASM using the ML Kit model path supplied in the init message. This covers
 * servers and VMs where the main-thread tier detector passes GPU checks (software rasteriser) but
 * the Worker's OffscreenCanvas context creation fails.
 *
 * @param {Object} data - Init message payload.
 * @param {string} data.backend - 'webgl' (MEDIUM tier) or 'webgpu' (HIGH tier).
 * @param {string} data.modelType - 'general' or 'landscape'.
 * @param {number} data.segWidth - Unused here; inference at bitmap resolution.
 * @param {number} data.segHeight - Unused here; inference at bitmap resolution.
 * @param {string} data.tfliteModelPath - TFLite model URL used if GPU fallback is triggered.
 * @param {string} data.tfliteWasmBase - TFLite WASM base URL used if GPU fallback is triggered.
 * @returns {Promise<void>}
 */
async function handleInitTfjs(data: {
    backend: string;
    modelType: string;
    segHeight: number;
    segWidth: number;
    tfliteModelPath: string;
    tfliteWasmBase: string;
}): Promise<void> {
    const { backend, modelType, tfliteModelPath, tfliteWasmBase } = data;

    try {
        const backendSet = await tf.setBackend(backend);

        await tf.ready();

        if (!backendSet || tf.getBackend() !== backend) {
            // GPU backend unavailable in this Worker context — fall back to TFLite.
            currentBackend = BackendType.TFLITE;
            await handleInitTflite({ segHeight: 256, segWidth: 256, tfliteModelPath, tfliteWasmBase });

            return;
        }

        segmenter = await bs.createSegmenter(
            bs.SupportedModels.MediaPipeSelfieSegmentation,
            { modelType, runtime: 'tfjs' } as MediaPipeSelfieSegmentationTfjsModelConfig
        );

        workerPost({ backend: currentBackend, segHeight: data.segHeight, segWidth: data.segWidth, type: 'init_done' });
    } catch (err) {
        // GPU init threw (e.g. OffscreenCanvas WebGL context creation failed) — fall back to TFLite.
        currentBackend = BackendType.TFLITE;
        try {
            await handleInitTflite({ segHeight: 256, segWidth: 256, tfliteModelPath, tfliteWasmBase });
        } catch (tfliteErr) {
            workerPost({ error: String(tfliteErr), type: 'init_error' });
        }
    }
}

/**
 * Returns true when the runtime supports WebAssembly SIMD instructions.
 *
 * Uses WebAssembly.validate with a minimal module containing a v128.const SIMD instruction.
 * Returns false on any error (older browsers, WASM disabled, etc.).
 *
 * @returns {boolean}
 */
function detectSimd(): boolean {
    try {
        return WebAssembly.validate(new Uint8Array([
            0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123,
            3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11
        ]));
    } catch {
        return false;
    }
}

/**
 * Initialises the TFLite WASM backend for LOW tier using the ML Kit Selfie Segmentation model.
 *
 * Loads the appropriate WASM runtime (SIMD or standard) using the createTFLiteModule /
 * createTFLiteSIMDModule factory with a locateFile override so the .wasm binary is resolved
 * from the deployment libs/ directory rather than from the (unusable) blob: worker origin.
 * Fetches the .tflite model, writes it to the TFLite HEAPU8 buffer, and calls _loadModel().
 * Pre-computes HEAPF32 input/output offsets and creates an OffscreenCanvas for pixel readback.
 *
 * @param {Object} data - Init message payload for the TFLITE tier.
 * @param {string} data.modelPath - Absolute URL of the ML Kit TFLite model.
 * @param {number} data.segHeight - Segmentation canvas height (256 for ML Kit).
 * @param {number} data.segWidth - Segmentation canvas width (256 for ML Kit).
 * @param {string} data.tfliteWasmBase - Base URL for tflite*.wasm binaries (trailing slash).
 * @returns {Promise<void>}
 */
async function handleInitTflite(data: {
    segHeight: number;
    segWidth: number;
    tfliteModelPath: string;
    tfliteWasmBase: string;
}): Promise<void> {
    try {
        const { segHeight, segWidth, tfliteModelPath, tfliteWasmBase } = data;

        if (!isSameOriginUrl(tfliteModelPath) || !isSameOriginUrl(`${tfliteWasmBase}tflite.wasm`)) {
            workerPost({ error: 'TFLite model or WASM path must be same-origin', type: 'init_error' });

            return;
        }

        // Select SIMD-optimised runtime when available — roughly 2x faster than standard WASM.
        const simdSupported = detectSimd();
        const tfliteFactory = simdSupported ? createTFLiteSIMDModule : createTFLiteModule;

        // locateFile overrides WASM path resolution — required because the worker runs from a
        // blob: URL whose origin is "null", making relative path resolution fail.
        tfliteModule = await tfliteFactory({
            locateFile: (path: string) => `${tfliteWasmBase}${path}`
        });

        // Fetch and load model into TFLite WASM heap.
        const modelResponse = await fetch(tfliteModelPath, { credentials: 'same-origin' });

        if (!modelResponse.ok) {
            workerPost({ error: `TFLite model fetch failed: HTTP ${modelResponse.status}`, type: 'init_error' });

            return;
        }

        const modelBuffer = await modelResponse.arrayBuffer();

        tfliteModule.HEAPU8.set(new Uint8Array(modelBuffer), tfliteModule._getModelBufferMemoryOffset());
        tfliteModule._loadModel(modelBuffer.byteLength);

        // Pre-compute HEAPF32 offsets to avoid divide-by-4 on every frame.
        tfliteInputOffset = tfliteModule._getInputMemoryOffset() / 4;
        tfliteOutputOffset = tfliteModule._getOutputMemoryOffset() / 4;
        tfliteSegWidth = segWidth;
        tfliteSegHeight = segHeight;
        tflitePixelCount = segWidth * segHeight;

        tfliteReadCanvas = new OffscreenCanvas(segWidth, segHeight);
        tfliteReadCtx = tfliteReadCanvas.getContext('2d', { willReadFrequently: true });

        workerPost({ backend: currentBackend, segHeight: tfliteSegHeight, segWidth: tfliteSegWidth, type: 'init_done' });
    } catch (err) {
        workerPost({ error: String(err), type: 'init_error' });
    }
}

/**
 * Dispatches an inference call to the TFLite or TF.js handler based on the active backend.
 *
 * @param {ImageBitmap} bitmap - Pre-scaled camera frame at the tier's segmentation resolution.
 * @returns {Promise<void>}
 */
async function handleInfer(bitmap: ImageBitmap): Promise<void> {
    if (currentBackend === BackendType.TFLITE) {
        await handleInferTflite(bitmap);
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
 * Runs one TFLite inference cycle on the transferred ImageBitmap.
 *
 * Draws the bitmap to an OffscreenCanvas, fills the TFLite HEAPF32 input buffer with NHWC
 * float32 RGB values normalised to [0,1], calls _runInference(), and reads the single-channel
 * output (ML Kit Selfie Segmentation outputs one float per pixel: person confidence in [0,1]).
 * Writes the confidence value to both R and A channels of the returned Uint8ClampedArray so
 * it is compatible with both the WebGL compositor (reads .r) and the Canvas 2D fallback (reads alpha).
 *
 * @param {ImageBitmap} bitmap - Pre-scaled camera frame at seg resolution.
 * @returns {Promise<void>}
 */
async function handleInferTflite(bitmap: ImageBitmap): Promise<void> {
    if (!tfliteModule || !tfliteReadCtx) {
        bitmap.close();
        workerPost({ error: 'TFLite not initialised', type: 'infer_error' });

        return;
    }

    try {
        // Draw pre-scaled bitmap to the read canvas and extract RGBA pixels.
        tfliteReadCtx.drawImage(bitmap, 0, 0, tfliteSegWidth, tfliteSegHeight);
        const imageData = tfliteReadCtx.getImageData(0, 0, tfliteSegWidth, tfliteSegHeight);

        // Fill NHWC float32 input [1, H, W, 3] with RGB channels normalised to [0, 1].
        const pixelCount = tflitePixelCount;

        for (let i = 0; i < pixelCount; i++) {
            tfliteModule.HEAPF32[tfliteInputOffset + i * 3] = imageData.data[i * 4] / 255;
            tfliteModule.HEAPF32[tfliteInputOffset + i * 3 + 1] = imageData.data[i * 4 + 1] / 255;
            tfliteModule.HEAPF32[tfliteInputOffset + i * 3 + 2] = imageData.data[i * 4 + 2] / 255;
        }

        // Run TFLite inference (synchronous WASM call).
        tfliteModule._runInference();

        // Read single-channel output: one float per pixel (person confidence in [0, 1]).
        // ML Kit selfie segmentation model outputs probabilities directly — no softmax needed.
        const maskBytes = new Uint8ClampedArray(pixelCount * 4);

        for (let i = 0; i < pixelCount; i++) {
            const v = Math.round(tfliteModule.HEAPF32[tfliteOutputOffset + i] * 255);

            maskBytes[i * 4] = v; // R — read by WebGL compositor shader (.r channel)
            maskBytes[i * 4 + 3] = v; // A — read by Canvas 2D fallback compositing path
        }

        workerPost(
            { data: maskBytes, height: tfliteSegHeight, type: 'mask', width: tfliteSegWidth },
            [ maskBytes.buffer ]
        );
    } catch (err) {
        workerPost({ error: String(err), type: 'infer_error' });
    } finally {
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

    // TFLite: module has no explicit dispose API; null refs allow GC.
    tfliteModule = null;
    tfliteReadCanvas = null;
    tfliteReadCtx = null;

    currentBackend = '';
}
