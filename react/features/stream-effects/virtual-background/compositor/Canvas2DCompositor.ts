import { ICompositeOptions, ICompositor } from './ICompositor';

/**
 * Canvas 2D three-pass compositor.
 *
 * Extracted from V1's {@code runPostProcessing} and V2's {@code _compositeFallback}.
 * Uses {@code globalCompositeOperation} to blend the segmentation mask, camera
 * foreground, and background into a single output frame on the CPU.
 *
 * Falls back gracefully when context creation fails. Callers should check
 * {@link Canvas2DCompositor#isAvailable} before use.
 */
export default class Canvas2DCompositor implements ICompositor {
    _canvas: HTMLCanvasElement;
    _ctx: CanvasRenderingContext2D | null = null;
    _maskCanvas: HTMLCanvasElement | null = null;
    _maskCanvasCtx: CanvasRenderingContext2D | null = null;

    /**
     * Creates a Canvas2DCompositor with an internal output canvas and mask helper canvas.
     */
    constructor() {
        this._canvas = document.createElement('canvas');
        this._ctx = this._canvas.getContext('2d');
        this._maskCanvas = document.createElement('canvas');
        this._maskCanvasCtx = this._maskCanvas.getContext('2d');
    }

    /**
     * Returns true if a 2D rendering context is active and ready.
     *
     * @returns {boolean}
     */
    get isAvailable(): boolean {
        return this._ctx !== null;
    }

    /**
     * Returns the canvas element that receives the composited output each frame.
     *
     * @returns {HTMLCanvasElement}
     */
    get outputCanvas(): HTMLCanvasElement {
        return this._canvas;
    }

    /**
     * Composites one frame using three-pass Canvas 2D blending.
     *
     * 1. Draw the blurred segmentation mask (person silhouette).
     * 2. Clip the camera foreground to the mask via {@code source-in}.
     * 3. Draw the background behind the person via {@code destination-over}.
     *
     * The mask {@code ImageData} is painted onto a persistent helper canvas via
     * {@code putImageData} which writes raw bytes without premultiplied-alpha
     * conversion, then scaled to the output dimensions with {@code drawImage}.
     *
     * @param {CanvasImageSource} camera - Live camera frame.
     * @param {CanvasImageSource} background - Pre-rendered background (blur or image).
     * @param {ImageData} maskData - Raw segmentation mask bytes.
     * @param {ICompositeOptions} options - Edge thresholds, blur radius, and first-frame flag.
     * @returns {void}
     */
    composite(
            camera: CanvasImageSource,
            background: CanvasImageSource,
            maskData: ImageData,
            options: ICompositeOptions): void {
        const ctx = this._ctx;
        const maskCanvas = this._maskCanvas;

        if (!ctx || !maskCanvas) {
            return;
        }
        const { width, height } = this._canvas;

        ctx.globalCompositeOperation = 'copy';

        if (maskCanvas.width !== maskData.width
                || maskCanvas.height !== maskData.height) {
            maskCanvas.width = maskData.width;
            maskCanvas.height = maskData.height;
        }

        // putImageData writes raw bytes — no premultiplied-alpha distortion.
        this._maskCanvasCtx?.putImageData(maskData, 0, 0);

        ctx.filter = options.cssBlurFilter;
        ctx.drawImage(maskCanvas, 0, 0, width, height);

        // Clip foreground to mask.
        ctx.globalCompositeOperation = 'source-in';
        ctx.filter = 'none';
        ctx.drawImage(camera, 0, 0, width, height);

        // Draw background behind the person.
        ctx.globalCompositeOperation = 'destination-over';
        ctx.drawImage(background as CanvasImageSource, 0, 0, width, height);
    }

    /**
     * Releases all rendering contexts and helper canvases.
     *
     * @returns {void}
     */
    dispose(): void {
        this._ctx = null;
        this._maskCanvas = null;
        this._maskCanvasCtx = null;
    }

    /**
     * Resizes the output canvas to the given dimensions.
     *
     * @param {number} width - New width in pixels.
     * @param {number} height - New height in pixels.
     * @returns {void}
     */
    resize(width: number, height: number): void {
        this._canvas.width = width;
        this._canvas.height = height;
    }
}
