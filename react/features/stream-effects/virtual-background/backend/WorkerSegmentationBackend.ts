import { getBaseUrl } from '../../../base/util/helpers';
import logger from '../../../virtual-background/logger';
import { BackendType, IDeviceCapabilities } from '../DeviceTierDetector';

import { ISegmentationBackend } from './ISegmentationBackend';

/**
 * Worker-based segmentation backend.
 *
 * Wraps the {@link VBInferenceWorker} message protocol to provide the
 * {@link ISegmentationBackend} interface. The worker runs TF.js body-segmentation
 * (MEDIUM/HIGH tiers via WebGL/WebGPU) or TFLite WASM (LOW tier via
 * selfie_segmentation_landscape) in a dedicated Web Worker thread.
 *
 * The worker may fall back from a GPU backend to TFLite if the GPU context is unavailable
 * inside the Worker. When this happens, the capabilities are updated to reflect the
 * actual backend and segmentation dimensions.
 *
 * EMA temporal smoothing is NOT applied here — that is the processor's responsibility.
 * The backend returns raw mask ImageData from each inference call.
 */
export default class WorkerSegmentationBackend implements ISegmentationBackend {
    _capabilities: IDeviceCapabilities;
    _pendingInferHandler: ((e: MessageEvent) => void) | null = null;
    _pendingInferResolve: ((value: ImageData | null) => void) | null = null;
    _worker: Worker | null = null;
    _workerReady = false;

    /**
     * Creates a new worker-based segmentation backend.
     *
     * @param {IDeviceCapabilities} capabilities - Detected device capabilities.
     */
    constructor(capabilities: IDeviceCapabilities) {
        this._capabilities = { ...capabilities };
    }

    /**
     * Returns the device capabilities for this backend.
     *
     * @returns {IDeviceCapabilities} The capabilities (may be updated after worker fallback).
     */
    get capabilities(): IDeviceCapabilities {
        return this._capabilities;
    }

    /**
     * Creates the inference worker and sends the init message.
     *
     * The worker is loaded via an importScripts blob URL pattern (same approach as
     * FaceLandmarksDetector) to load the pre-built worker bundle from /libs/ without
     * a separate module-worker instantiation.
     *
     * Resolves when the worker signals init_done. If the worker falls back to a
     * different backend, capabilities are updated to reflect the actual backend
     * and segmentation dimensions.
     *
     * @returns {Promise<void>} Resolves when the worker is ready for inference.
     * @throws {Error} When the worker signals init_error.
     */
    async init(): Promise<void> {
        const base = getBaseUrl().replace(/\/?$/, '/');
        const workerUrl = `${base}libs/vb-inference-worker.min.js`;

        // @ts-ignore — @types/node's BlobOptions / URL shadow DOM BlobPropertyBag / URL here.
        const blob = new Blob([ `importScripts("${workerUrl}");` ], { type: 'application/javascript' });

        // @ts-ignore
        const blobUrl = window.URL.createObjectURL(blob);

        this._worker = new Worker(blobUrl, { name: 'VB V2 Inference' });

        // @ts-ignore
        window.URL.revokeObjectURL(blobUrl);

        const { promise, resolve, reject } = Promise.withResolvers<void>();

        const handler = (e: MessageEvent) => {
            if (e.data.type === 'init_done') {
                this._worker?.removeEventListener('message', handler);
                this._workerReady = true;

                // Worker may have fallen back to TFLite if the GPU backend was unavailable.
                const reportedBackend = e.data.backend as string;
                const validBackends: string[] = Object.values(BackendType);

                if (reportedBackend && validBackends.includes(reportedBackend)
                        && reportedBackend !== this._capabilities.backend) {
                    logger.debug(
                        `[WorkerBackend] Worker fell back from ${this._capabilities.backend}`
                        + ` to ${reportedBackend}`
                    );
                    this._capabilities = {
                        ...this._capabilities,
                        backend: reportedBackend as BackendType,
                        segHeight: e.data.segHeight ?? this._capabilities.segHeight,
                        segWidth: e.data.segWidth ?? this._capabilities.segWidth
                    };
                }

                logger.debug(
                    `[WorkerBackend] Inference worker ready (tier: ${this._capabilities.tier},`
                    + ` backend: ${this._capabilities.backend})`
                );
                resolve();
            } else if (e.data.type === 'init_error') {
                this._worker?.removeEventListener('message', handler);
                reject(new Error(`Inference worker init error: ${e.data.error}`));
            }
        };

        this._worker.addEventListener('message', handler);

        const tfliteModelPath = `${base}libs/selfie_segmentation_landscape.tflite`;

        logger.debug(
            `[WorkerBackend] Initialising inference worker — backend: ${this._capabilities.backend}`
            + ` | model: ${tfliteModelPath}`
            + ` | seg: ${this._capabilities.segWidth}x${this._capabilities.segHeight}`
        );

        this._worker.postMessage({
            backend: this._capabilities.backend,
            segHeight: this._capabilities.segHeight,
            segWidth: this._capabilities.segWidth,
            tfliteModelPath,
            tfliteWasmBase: `${base}libs/`,
            type: 'init'
        });

        const timeout = new Promise<never>((_, rej) => {
            setTimeout(() => rej(new Error('Inference worker init timed out (30s)')), 30_000);
        });

        return Promise.race([ promise, timeout ]);
    }

    /**
     * Sends a pre-scaled ImageBitmap to the inference worker and awaits the mask.
     *
     * The bitmap is transferred (zero-copy). The worker runs segmentation and returns
     * the raw mask Uint8ClampedArray (also transferred). The mask is wrapped in an
     * ImageData and returned directly — no EMA smoothing is applied here.
     *
     * Only one inference call can be in flight at a time. The caller (processor) is
     * responsible for enforcing sequential call discipline.
     *
     * @param {ImageBitmap} bitmap - Pre-scaled camera frame at seg resolution.
     * @returns {Promise<ImageData | null>} Raw mask, or null if inference failed.
     */
    infer(bitmap: ImageBitmap): Promise<ImageData | null> {
        if (!this._worker || !this._workerReady) {
            bitmap.close();

            return Promise.resolve(null);
        }

        const { promise, resolve } = Promise.withResolvers<ImageData | null>();

        this._pendingInferResolve = resolve;

        const handler = (e: MessageEvent) => {
            if (e.data.type === 'mask') {
                this._worker?.removeEventListener('message', handler);
                if (this._pendingInferHandler === handler) {
                    this._pendingInferHandler = null;
                }
                if (this._pendingInferResolve === resolve) {
                    this._pendingInferResolve = null;
                }

                resolve(new ImageData(
                    e.data.data as Uint8ClampedArray,
                    e.data.width as number,
                    e.data.height as number
                ));
            } else if (e.data.type === 'infer_error') {
                this._worker?.removeEventListener('message', handler);
                if (this._pendingInferHandler === handler) {
                    this._pendingInferHandler = null;
                }
                if (this._pendingInferResolve === resolve) {
                    this._pendingInferResolve = null;
                }
                logger.warn('[WorkerBackend] Worker inference error:', e.data.error);
                resolve(null);
            }
        };

        this._pendingInferHandler = handler;
        this._worker.addEventListener('message', handler);
        this._worker.postMessage(
            { bitmap, type: 'infer' },
            [ bitmap as unknown as Transferable ]
        );

        return promise;
    }

    /**
     * Stops the inference worker and releases all resources.
     *
     * Aborts any pending inference call (removes the message handler and resolves
     * with null), sends a stop message to the worker, and terminates it.
     *
     * @returns {Promise<void>}
     */
    async stop(): Promise<void> {
        if (this._pendingInferHandler && this._worker) {
            this._worker.removeEventListener('message', this._pendingInferHandler);
        }
        this._pendingInferHandler = null;
        this._pendingInferResolve?.(null);
        this._pendingInferResolve = null;

        if (this._worker) {
            this._worker.postMessage({ type: 'stop' });
            this._worker.terminate();
            this._worker = null;
        }
        this._workerReady = false;

        logger.debug('[WorkerBackend] Stopped');
    }
}
