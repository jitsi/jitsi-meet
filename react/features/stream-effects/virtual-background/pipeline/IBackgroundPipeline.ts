/**
 * Processes a single video frame through segmentation and compositing.
 *
 * Implementations wrap the full per-frame pipeline: inference, background
 * preparation, mask EMA smoothing, and final compositing.
 */
export interface IFrameProcessor {

    /**
     * Releases all resources held by the processor.
     *
     * @returns {void}
     */
    dispose: () => void;

    /**
     * Runs the full processing pipeline on one camera frame.
     *
     * @param {CanvasImageSource} source - Current camera frame.
     * @returns {Promise<HTMLCanvasElement | null>} Composited output canvas, or null on failure.
     */
    processFrame: (source: CanvasImageSource) => Promise<HTMLCanvasElement | null>;
}

/**
 * Drives frame delivery from a camera stream through a processor and produces
 * a processed output stream.
 *
 * Two implementations exist:
 * - Insertable streams path ({@code MediaStreamTrackProcessor}/{@code MediaStreamTrackGenerator}).
 * - CaptureStream path ({@code HTMLCanvasElement.captureStream} with rVFC + keepalive worker).
 */
export interface IBackgroundPipeline {

    /**
     * Starts frame processing on the given input stream.
     *
     * @param {MediaStream} inputStream - Camera media stream.
     * @param {IFrameProcessor} processor - Per-frame processing callback.
     * @returns {MediaStream} Processed output stream.
     */
    start: (inputStream: MediaStream, processor: IFrameProcessor) => MediaStream;

    /**
     * Stops the pipeline and releases all resources.
     *
     * @returns {Promise<void>} Resolves when the pipeline has fully stopped.
     */
    stop: () => Promise<void>;
}
