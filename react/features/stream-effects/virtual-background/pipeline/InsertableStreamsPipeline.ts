import logger from '../../../virtual-background/logger';

import { IBackgroundPipeline, IFrameProcessor } from './IBackgroundPipeline';

/**
 * Frame delivery pipeline using the Insertable Streams API.
 *
 * Reads {@code VideoFrame} objects from a {@code MediaStreamTrackProcessor}, passes them
 * through the processor, and writes the results to a {@code MediaStreamTrackGenerator}.
 * No {@code requestVideoFrameCallback} or keepalive Worker is needed — the readable stream
 * delivers frames directly from the camera regardless of tab visibility.
 */
export default class InsertableStreamsPipeline implements IBackgroundPipeline {
    _isLoopStarted = false;
    _isRunning = false;
    _outputCanvasElement: HTMLCanvasElement;
    _processor: IFrameProcessor | null = null;
    _trackGenerator: (MediaStreamTrack & { writable: WritableStream<VideoFrame>; }) | null = null;
    _trackProcessor: { readable: ReadableStream<VideoFrame>; } | null = null;
    _trackReader: ReadableStreamDefaultReader<VideoFrame> | null = null;

    /**
     * Creates a new insertable streams pipeline.
     */
    constructor() {
        // Output canvas is used as the composited-frame source for creating VideoFrames.
        // Size is set in start() when the input stream dimensions are known.
        this._outputCanvasElement = document.createElement('canvas');
        this._outputCanvasElement.getContext('2d');
    }

    /**
     * Returns true when the browser supports the insertable streams API.
     *
     * @returns {boolean}
     */
    static isSupported(): boolean {
        return 'MediaStreamTrackProcessor' in window
            && 'MediaStreamTrackGenerator' in window;
    }

    /**
     * Starts the insertable streams pipeline on the given input stream.
     *
     * @param {MediaStream} inputStream - Camera media stream.
     * @param {IFrameProcessor} processor - Per-frame processing callback.
     * @returns {MediaStream} Processed output stream via MediaStreamTrackGenerator.
     */
    start(inputStream: MediaStream, processor: IFrameProcessor): MediaStream {
        this._isRunning = true;
        this._processor = processor;

        const firstVideoTrack = inputStream.getVideoTracks()[0];
        const { height, width } = firstVideoTrack.getSettings
            ? firstVideoTrack.getSettings()
            : firstVideoTrack.getConstraints();
        const videoWidth = parseInt(String(width), 10);
        const videoHeight = parseInt(String(height), 10);

        // Size the output canvas for the Canvas 2D compositor fallback.
        this._outputCanvasElement.width = videoWidth;
        this._outputCanvasElement.height = videoHeight;

        this._trackProcessor = new window.MediaStreamTrackProcessor(
            { track: firstVideoTrack, maxBufferSize: 2 }
        );
        this._trackGenerator = new window.MediaStreamTrackGenerator({ kind: 'video' });

        // Patch getSettings() on the generator so JitsiLocalTrack's constructor can read
        // dimensions immediately (before frames flow). MediaStreamTrackGenerator.getSettings()
        // returns {} until the first frame is written; this causes the constraint-caching code
        // in JitsiLocalTrack's constructor to crash. We proxy the input track's settings until
        // the generator has its own, making the IS path safe to pass to the constructor directly.
        // Any browser that supports IS also supports getSettings().
        const inputSettings = firstVideoTrack.getSettings();
        const generator = this._trackGenerator;
        const originalGetSettings = generator.getSettings.bind(generator);

        generator.getSettings = () => {
            const settings = originalGetSettings();

            // Once the generator reports its own width, stop proxying.
            if (settings.width) {
                return settings;
            }

            return { ...inputSettings, ...settings };
        };

        logger.debug('[InsertableStreamsPipeline] Using insertable streams path');

        // Start the async frame loop. The loop processes frames immediately
        // once the processor signals readiness via processFrame returning non-null.
        this._runLoop();

        return new MediaStream([ this._trackGenerator as MediaStreamTrack ]);
    }

    /**
     * Stops the pipeline and releases all I/O resources.
     *
     * @returns {Promise<void>}
     */
    async stop(): Promise<void> {
        this._isRunning = false;
        this._processor = null;

        // Cancel the reader immediately so any VideoFrames buffered in the processor's
        // queue are flushed and closed, preventing "VideoFrame GC'd without close()" warnings.
        this._trackReader?.cancel().catch(() => undefined);
        this._trackReader = null;
        this._trackProcessor = null;
        this._trackGenerator = null;
    }

    /**
     * Drives the frame processing loop via the readable stream from the track processor.
     *
     * @private
     * @returns {Promise<void>}
     */
    async _runLoop(): Promise<void> {
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

        // Expose the reader so stop() can cancel it immediately, causing the pending
        // reader.read() to reject and the loop to exit without waiting for the next frame.
        this._trackReader = reader;
        const writer = generator.writable.getWriter();

        try {
            while (this._isRunning) {
                const { value: frame, done } = await reader.read();

                if (done || !frame) {
                    break;
                }

                if (!this._processor) {
                    try {
                        await writer.write(frame);
                    } catch (err) {
                        logger.error('[InsertableStreamsPipeline] Write error', err);
                    }
                    frame.close();
                    continue;
                }

                let resultCanvas: HTMLCanvasElement | null = null;

                try {
                    resultCanvas = await this._processor.processFrame(frame);
                } catch (err) {
                    logger.error('[InsertableStreamsPipeline] Frame processing error', err);
                }

                if (resultCanvas) {
                    try {
                        const outFrame = new VideoFrame(
                            resultCanvas, { timestamp: frame.timestamp }
                        );

                        await writer.write(outFrame);
                        outFrame.close();
                    } catch (err) {
                        logger.error('[InsertableStreamsPipeline] Write error', err);
                    }
                } else {
                    // Passthrough — write the raw frame to the generator.
                    try {
                        await writer.write(frame);
                    } catch (err) {
                        logger.error('[InsertableStreamsPipeline] Passthrough write error', err);
                    }
                }

                frame.close();
            }
        } catch (err) {
            // When stop() cancels the reader, reader.read() rejects — that is expected.
            if (this._isRunning) {
                logger.error('[InsertableStreamsPipeline] Loop error', err);
            }
        } finally {
            this._trackReader = null;
            this._isLoopStarted = false;

            // Cancel reader to flush any VideoFrames still buffered in the processor's queue.
            try {
                await reader.cancel();
            } catch { /* ignore — may have already been cancelled by stop() */ }

            writer.releaseLock();
        }
    }
}
