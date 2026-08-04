/**
 * Virtual Background V2 — inference worker.
 *
 * Handles TF.js body-segmentation (MEDIUM/HIGH tiers via WebGL/WebGPU) and TFLite WASM
 * (LOW tier via selfie_segmentation_landscape) in a single dedicated Web Worker. Running
 * all inference in a Worker keeps the main thread free for UI events. For GPU tiers, the
 * Worker's OffscreenCanvas-backed WebGL context is not subject to Chrome's tab-visibility
 * GPU scheduling throttle.
 */
/*
 * Message protocol
 *
 *   Main -> Worker:
 *     { type: 'init', backend: string, segWidth: number, segHeight: number,
 *       tfliteModelPath: string, tfliteWasmBase: string }
 *     { type: 'infer', bitmap: ImageBitmap }   (bitmap is transferred -- zero-copy)
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
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import * as tf from '@tensorflow/tfjs-core';
import type { BodySegmenter, MediaPipeSelfieSegmentationTfjsModelConfig }
    from '@tensorflow-models/body-segmentation';
import * as bs from '@tensorflow-models/body-segmentation';

import { BackendType } from '../DeviceTierDetector';
// @ts-ignore
import createTFLiteSIMDModule from '../vendor/tflite/tflite-simd';

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

/** Active FaceLandmarker instance (MEDIUM/HIGH tiers only). Null when AR is disabled or unavailable. */
let faceLandmarker: FaceLandmarker | null = null;

/** Whether AR face tracking initialised successfully for this session. */
let arEnabled = false;

let arFrameTimestamp = 0;

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
        await handleInfer(e.data.bitmap as ImageBitmap, (e.data.arBitmap ?? null) as ImageBitmap | null);
    }
};

/**
 * Initialises the worker backend based on the tier signalled by the main thread.
 *
 * Routes to the TFLite handler for LOW tier (backend 'tflite') or the TF.js handler for
 * MEDIUM/HIGH tiers (backend 'webgl' or 'webgpu'). The TFLite model path and WASM base are
 * always passed so the TF.js handler can fall back to TFLite if GPU init fails in the Worker.
 *
 * Initializes FaceLandmarker (AR) if arEnabled and currentBackend!==TFLITE.
 *
 * @param {Object} data - Init message payload.
 * @param {string} data.backend - 'tflite', 'webgl', or 'webgpu'.
 * @param {number} data.segHeight - Segmentation canvas height.
 * @param {number} data.segWidth - Segmentation canvas width.
 * @param {string} data.tfliteModelPath - Absolute URL of the TFLite segmentation model.
 * @param {string} data.tfliteWasmBase - Base URL for tflite*.wasm binaries (trailing slash).
 * @returns {Promise<void>}
 */
async function handleInit(data: {
    arEnabled?: boolean;
    arModelPath?: string;
    arWasmBase?: string;
    backend: BackendType;
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

    // AR initialisation - Initializes FaceLandmarker (AR) only if arEnabled and currentBackend!==TFLITE.
    if (data.arEnabled && currentBackend !== BackendType.TFLITE) {
        try {
            await handleInitFaceLandmarker(data.arWasmBase!, data.arModelPath!);
            arEnabled = true;

        } catch (err) {
            workerPost({ error: String(err), type: 'ar_init_error' });
            arEnabled = false;
        }
    }
}

/**
 * Initialises TF.js with the tier-appropriate backend and creates the body-segmentation model.
 * In a Worker, TF.js automatically uses OffscreenCanvas for its WebGL context (document is
 * unavailable). Chrome does not apply tab-visibility GPU throttling to Worker GPU contexts.
 *
 * If the requested GPU backend is unavailable (no GPU, OffscreenCanvas WebGL unsupported, etc.),
 * falls back to TFLite WASM using the TFLite model path supplied in the init message. This covers
 * servers and VMs where the main-thread tier detector passes GPU checks (software rasteriser) but
 * the Worker's OffscreenCanvas context creation fails.
 *
 * @param {Object} data - Init message payload.
 * @param {string} data.backend - 'webgl' (MEDIUM tier) or 'webgpu' (HIGH tier).
 * @param {number} data.segWidth - Unused here; inference at bitmap resolution.
 * @param {number} data.segHeight - Unused here; inference at bitmap resolution.
 * @param {string} data.tfliteModelPath - TFLite model URL used if GPU fallback is triggered.
 * @param {string} data.tfliteWasmBase - TFLite WASM base URL used if GPU fallback is triggered.
 * @returns {Promise<void>}
 */
async function handleInitTfjs(data: {
    backend: string;
    segHeight: number;
    segWidth: number;
    tfliteModelPath: string;
    tfliteWasmBase: string;
}): Promise<void> {
    const { backend, tfliteModelPath, tfliteWasmBase } = data;

    try {
        const backendSet = await tf.setBackend(backend);

        await tf.ready();

        if (!backendSet || tf.getBackend() !== backend) {
            // GPU backend unavailable in this Worker context — fall back to TFLite.
            currentBackend = BackendType.TFLITE;
            await handleInitTflite({ segHeight: 144, segWidth: 256, tfliteModelPath, tfliteWasmBase });

            return;
        }

        segmenter = await bs.createSegmenter(
            bs.SupportedModels.MediaPipeSelfieSegmentation,
            { modelType: 'landscape', runtime: 'tfjs' } as MediaPipeSelfieSegmentationTfjsModelConfig
        );

        workerPost({ backend: currentBackend, segHeight: data.segHeight, segWidth: data.segWidth, type: 'init_done' });
    } catch (err) {
        // GPU init threw (e.g. OffscreenCanvas WebGL context creation failed) — fall back to TFLite.
        currentBackend = BackendType.TFLITE;
        try {
            await handleInitTflite({ segHeight: 144, segWidth: 256, tfliteModelPath, tfliteWasmBase });
        } catch (tfliteErr) {
            workerPost({ error: String(tfliteErr), type: 'init_error' });
        }
    }
}

/**
 * Initialises the TFLite WASM backend for LOW tier using the selfie_segmentation_landscape model.
 *
 * Loads the SIMD WASM runtime via createTFLiteSIMDModule with a locateFile override so the
 * .wasm binary is resolved from the deployment libs/ directory rather than from the (unusable)
 * blob: worker origin. Fetches the .tflite model, writes it to the TFLite HEAPU8 buffer, and
 * calls _loadModel(). Pre-computes HEAPF32 input/output offsets and creates an OffscreenCanvas
 * for pixel readback.
 *
 * @param {Object} data - Init message payload for the TFLITE tier.
 * @param {string} data.modelPath - Absolute URL of the TFLite segmentation model.
 * @param {number} data.segHeight - Segmentation canvas height.
 * @param {number} data.segWidth - Segmentation canvas width.
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

        // locateFile overrides WASM path resolution — required because the worker runs from a
        // blob: URL whose origin is "null", making relative path resolution fail.
        tfliteModule = await createTFLiteSIMDModule({
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

        // Bounds-check the HEAPF32 input/output regions against the requested seg dimensions.
        // Catches a mismatch between the configured seg size and the model's actual tensor
        // shape before the inference loop starts silently clobbering WASM heap memory.
        const heapLen = tfliteModule.HEAPF32.length;
        const inputEnd = tfliteInputOffset + tflitePixelCount * 3; // NHWC float32, 3 channels.
        const outputEnd = tfliteOutputOffset + tflitePixelCount; // Single float per pixel.

        if (inputEnd > heapLen || outputEnd > heapLen) {
            workerPost({
                error: `TFLite heap bounds mismatch: segWidth=${segWidth} segHeight=${segHeight}`
                    + ` requires inputEnd=${inputEnd}/outputEnd=${outputEnd} but HEAPF32 is ${heapLen}.`
                    + ' Model input shape likely differs from the configured seg resolution.',
                type: 'init_error'
            });

            return;
        }

        tfliteReadCanvas = new OffscreenCanvas(segWidth, segHeight);
        tfliteReadCtx = tfliteReadCanvas.getContext('2d', { willReadFrequently: true });

        workerPost({ backend: currentBackend, segHeight: tfliteSegHeight, segWidth: tfliteSegWidth, type: 'init_done' });
    } catch (err) {
        workerPost({ error: String(err), type: 'init_error' });
    }
}

/**
 * Initialises MediaPipe FaceLandmarker for AR face tracking. Only with currentBackground !==TFLITE.
 *
 * MediaPipe checks for GPU, fallback to CPU XNNPACK if GPU is not found or not supported
 * Set to outputFacialTransformationMatrixes: true, returns the faceTransformationMatrix
 * * Runs in VIDEO mode so MediaPipe's internal temporal smooths landmarks across frames.
 *
 * @param {string} wasmBase - Base URL for @mediapipe/tasks-vision WASM binaries.
 * @param {string} modelPath - URL of the face_landmarker.task model file.
 * @returns {Promise<void>}
 * @throws {Error} When the model/WASM paths are not same-origin, or model load fails.
 */
async function handleInitFaceLandmarker(wasmBase: string, modelPath: string): Promise<void> {
    if (!isSameOriginUrl(modelPath) || !isSameOriginUrl(`${wasmBase}vision_wasm_internal.js`)) {
        throw new Error('FaceLandmarker model or WASM path must be same-origin');
    }

    const vision = await FilesetResolver.forVisionTasks(wasmBase);

    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            delegate: 'GPU',
            modelAssetPath: modelPath
        },
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO'
    });
}

/**
 * Internally dispatches TF.js or TFLite based on currentBackend.
 *
 * @param {ImageBitmap} bitmap - Camera frame for face landmark detection.
 * @returns {Promise} Resolves to object containing raw mask data, width, height, or null.
 */
async function runSegmentation(bitmap: ImageBitmap): Promise<{ data: Uint8ClampedArray; height: number; width: number; } | null> {
    return currentBackend === BackendType.TFLITE ? handleInferTflite(bitmap) : handleInferTfjs(bitmap);
}

/**
 * Uses mediapipe/tasks-vision.
 * Runs FaceLandmarker.detectForVideo() API to scan if there is face.
 * Returns 468-point 3D face mesh landmarks and a 4x4 facial transformation matrix for AR overlay.
 * Runs mediapipe faceLandMarker models and
 * Computes facial transformation matrix using MediaPipe Tasks Vision.
 *
 * @param {ImageBitmap} bitmap - Camera frame for face landmark detection.
 * @returns {Promise} Resolves to object containing faceLandmarks and facialTransformationMatrix, or null when no face.
 */
async function runFaceLandmarker(bitmap: ImageBitmap): Promise<{ faceLandmarks: number[][]; facialTransformationMatrix: number[] | null; } | null> {
    if (!faceLandmarker) {
        bitmap.close();

        return null;
    }
    try {
        arFrameTimestamp += 1;
        const result = faceLandmarker.detectForVideo(bitmap, arFrameTimestamp);

        if (!result.faceLandmarks?.length) {
            return null;
        }

        const faceLandmarks = result.faceLandmarks[0].map(lm => [ lm.x, lm.y, lm.z ]);
        const m = result.facialTransformationMatrixes?.[0];

        return { faceLandmarks, facialTransformationMatrix: m ? Array.from(m.data) : null };
    } catch (err) {
        workerPost({ error: String(err), type: 'ar_infer_error' });

        return null;
    } finally {
        bitmap.close();
    }
}

/**
 * Runs segmentation and (if AR is enabled) face landmark detection in parallel,
 * merges the results, and posts a single 'mask' message to the main thread.
 *
 * Delegates backend selection entirely to runSegmentation,
 * so this function won't know TF.js or TFLite produced the mask.
 * When arEnabled is false, arBitmap is ignored and the outgoing message carries null.
 *
 * @param {ImageBitmap} segBitmap - Pre-scaled camera frame at the tier's segmentation resolution.
 * @param {ImageBitmap|null} [arBitmap] - Pre-scaled camera frame for face landmark detection.
 * Required (non-null) when arEnabled is true; ignored otherwise.
 * @returns {Promise<void>} Resolves after the merged mask message is posted, or after a no-op if segmentation produced no mask.
 */
async function handleInfer(segBitmap: ImageBitmap, arBitmap: ImageBitmap | null = null): Promise<void> {
    const [ maskMsg, arResult ] = await Promise.all([ runSegmentation(segBitmap), arEnabled && arBitmap ? runFaceLandmarker(arBitmap) : null ]);

    if (maskMsg) {
        workerPost({ ...maskMsg, facialTransformationMatrix: arResult?.facialTransformationMatrix ?? null, faceLandmarks: arResult?.faceLandmarks ?? null, type: 'mask' },
            [ maskMsg.data.buffer as ArrayBuffer ]
        );
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
 * @returns {Promise} - Resolves to object containing mask data, height, width or null if the inference fails.
 */
async function handleInferTfjs(bitmap: ImageBitmap): Promise<{ data: Uint8ClampedArray; height: number; width: number; } | null> {
    if (!segmenter) {
        bitmap.close();
        workerPost({ error: 'Segmenter not initialised', type: 'infer_error' });

        return null;
    }

    tf.engine().startScope();
    try {
        const segmentations = await segmenter.segmentPeople(
            bitmap as unknown as HTMLImageElement, { flipHorizontal: false }
        );

        if (!segmentations.length) {
            workerPost({ error: 'No segmentation result', type: 'infer_error' });

            return null;
        }

        const maskData = await segmentations[0].mask.toImageData();
        const data = maskData.data;

        // returns data to runSegmentation
        return { data, height: maskData.height, width: maskData.width };
    } catch (err) {
        workerPost({ error: String(err), type: 'infer_error' });

        return null;
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
 * output (the model outputs one float per pixel: person confidence in [0,1]).
 * Writes the confidence value to both R and A channels of the returned Uint8ClampedArray so
 * it is compatible with both the WebGL compositor (reads .r) and the Canvas 2D fallback (reads alpha).
 *
 * @param {ImageBitmap} bitmap - Pre-scaled camera frame at seg resolution.
 * @returns {Promise} - Resolves to object containing mask data, height, width or null if the inference fails.
 */
async function handleInferTflite(bitmap: ImageBitmap): Promise<{ data: Uint8ClampedArray; height: number; width: number; } | null > {
    if (!tfliteModule || !tfliteReadCtx) {
        bitmap.close();
        workerPost({ error: 'TFLite not initialised', type: 'infer_error' });

        return null;
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
        // Model outputs probabilities directly — no softmax needed.
        const maskBytes = new Uint8ClampedArray(pixelCount * 4);

        for (let i = 0; i < pixelCount; i++) {
            const v = Math.round(tfliteModule.HEAPF32[tfliteOutputOffset + i] * 255);

            maskBytes[i * 4] = v; // R — read by WebGL compositor shader (.r channel)
            maskBytes[i * 4 + 3] = v; // A — read by Canvas 2D fallback compositing path
        }


        return { data: maskBytes, height: tfliteSegHeight, width: tfliteSegWidth };
    } catch (err) {
        workerPost({ error: String(err), type: 'infer_error' });

        return null;
    } finally {
        bitmap.close();
    }
}

