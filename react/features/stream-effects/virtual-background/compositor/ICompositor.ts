/**
 * Per-frame compositing parameters passed to every {@link ICompositor#composite} call.
 */
export interface ICompositeOptions {

    /** CSS blur filter for the mask in Canvas 2D fallback (e.g. 'blur(4px)'). */
    cssBlurFilter: string;

    /** Smoothstep upper threshold. Pixels above this are fully opaque. */
    edgeHigh: number;

    /** Smoothstep lower threshold. Pixels below this are fully transparent. */
    edgeLow: number;

    /** Gaussian blur radius in mask-texture pixels (0 disables blur). */
    maskBlurRadius: number;
}

/**
 * Abstraction over the compositing backend that blends camera, background,
 * and segmentation mask into a single output frame.
 *
 * Two implementations exist:
 * - {@code WebGLCompositor} — GPU-accelerated with temporal smoothing and edge feathering.
 * - {@code Canvas2DCompositor} — CPU fallback using three-pass Canvas 2D compositing.
 */
export interface ICompositor {

    /**
     * Composites one frame: blends camera foreground, background, and mask.
     *
     * @param {CanvasImageSource} camera - Live camera frame.
     * @param {CanvasImageSource} background - Pre-rendered background (blur or image).
     * @param {ImageData} maskData - Raw segmentation mask bytes.
     * @param {ICompositeOptions} options - Edge thresholds and blur radius.
     * @returns {void}
     */
    composite: (
        camera: CanvasImageSource,
        background: CanvasImageSource,
        maskData: ImageData,
        options: ICompositeOptions) => void;

    /**
     * Releases all resources held by the compositor.
     *
     * @returns {void}
     */
    dispose: () => void;

    /**
     * Whether the compositor was successfully initialised and is ready for use.
     */
    readonly isAvailable: boolean;

    /**
     * The canvas element that receives the composited output each frame.
     */
    readonly outputCanvas: HTMLCanvasElement;

    /**
     * Resizes the output canvas to the given dimensions.
     *
     * @param {number} width - New width in pixels.
     * @param {number} height - New height in pixels.
     * @returns {void}
     */
    resize: (width: number, height: number) => void;
}
