// @flow

import * as bodyPix from '@tensorflow-models/body-pix';
import * as StackBlur from 'stackblur-canvas';


const segmentationProperties = {
    flipHorizontal: false,
    internalResolution: 'medium',
    segmentationThreshold: 0.7,
    scoreThreshold: 0.2,
    maxDetections: 1
};


/**
 * Represents a modified MediaStream that adds blur to video background.
 * <tt>JitsiStreamBlurEffect</tt> does the processing of the original
 * video stream.
 */
export default class JitsiStreamBlurEffect {
    bpModel: bodyPix.BodyPix;
    stream: MediaStream;

    tmpVideo = document.createElement('video');

    videoRenderCanvas = document.createElement('canvas');

    bodyPixCanvas = document.createElement('canvas');

    finalCanvas = document.createElement('canvas');

    previousSegmentationComplete = true;
    lastSegmentation = null; // bodyPix.SemanticPersonSegmentation | null

    // worker: Worker;
    shouldContinue = true;

    blur: boolean = false;
    outStream: MediaStream | null = null;

    videoRenderCanvasCtx: CanvasRenderingContext2D;
    bodyPixCtx: CanvasRenderingContext2D;

    /**
     * Represents a modified video MediaStream track.
     *
     * @class
     * @param {bodyPix.BodyPix} bpModel - BodyPix model.

     */
    constructor(bpModel: bodyPix.BodyPix) {
        this.videoRenderCanvasCtx = this.videoRenderCanvas.getContext('2d');
        this.bodyPixCtx = this.bodyPixCanvas.getContext('2d');
        this.bpModel = bpModel;
    }

    /**
     * Starts loop to capture video frame and render the segmentation mask.
     *
     * @param {MediaStream} stream - Stream to be used for processing.
     * @param {boolean} blur - Do you want to blur?
     * @returns {MediaStream} - The stream with the applied effect.
     */
    startEffect(stream: MediaStream, blur: boolean = true) {
        this.stream = stream;

        this.blur = blur;

        this.tmpVideo.addEventListener('loadedmetadata', () => {
            this.setNewSettings(blur);
            this.finalCanvas.width = this.tmpVideo.videoWidth;
            this.finalCanvas.height = this.tmpVideo.videoHeight;
            this.videoRenderCanvas.width = this.tmpVideo.videoWidth;
            this.videoRenderCanvas.height = this.tmpVideo.videoHeight;
            this.bodyPixCanvas.width = this.tmpVideo.videoWidth;
            this.bodyPixCanvas.height = this.tmpVideo.videoHeight;

            const finalCanvasCtx = this.finalCanvas.getContext('2d');

            finalCanvasCtx.drawImage(this.tmpVideo, 0, 0);
        });

        this.tmpVideo.addEventListener('loadeddata', () => {
            this.tmpVideo.play();
            this.tick();
        });

        this.tmpVideo.srcObject = stream;

        // Workaround for FF issue https://bugzilla.mozilla.org/show_bug.cgi?id=1388974
        this.finalCanvas.getContext('2d');

        return this.getStream();
    }


    /**
     * Stops the capture and render loop.
     *
     * @returns {void}
     */
    stopEffect() {
        this.shouldContinue = false;
    }

    /**
     * Checks if the local track supports this effect.
     *
     * @param {JitsiLocalTrack} jitsiLocalTrack - Track to apply effect.
     * @returns {boolean} - Returns true if this effect can run on the specified track
     * false otherwise.
     */
    isEnabled(jitsiLocalTrack: Object) {
        return jitsiLocalTrack.isVideoTrack() && jitsiLocalTrack.videoType === 'camera';
    }


    /**
     * Render next frame.
     *
     * @returns {void}
     */
    tick() {
        this.videoRenderCanvasCtx.drawImage(this.tmpVideo, 0, 0);
        if (this.previousSegmentationComplete) {
            this.previousSegmentationComplete = false;
            this.bpModel.segmentPerson(this.videoRenderCanvas, segmentationProperties).then(segmentation => {
                this.lastSegmentation = segmentation;
                this.previousSegmentationComplete = true;
            });
        }
        this.processSegmentation(this.lastSegmentation);
        if (this.shouldContinue) {
            setTimeout(this.tick.bind(this), 1000 / 60);
        }
    }

    /**
     * Processes next frame.
     *
     * @param {bodyPix.SemanticPersonSegmentation | null} segmentation - Segmentation data.
     * @returns {void}
     */
    processSegmentation(segmentation: bodyPix.SemanticPersonSegmentation | null) {
        const ctx = this.finalCanvas.getContext('2d');
        const liveData = this.videoRenderCanvasCtx.getImageData(
            0,
            0,
            this.videoRenderCanvas.width,
            this.videoRenderCanvas.height
        );

        if (segmentation) {
            const blurData = new ImageData(liveData.data.slice(), liveData.width, liveData.height);

            StackBlur.imageDataRGB(blurData, 0, 0, liveData.width, liveData.height, 12);
            const dataL = liveData.data;

            for (let x = 0; x < this.finalCanvas.width; x++) {
                for (let y = 0; y < this.finalCanvas.height; y++) {
                    const n = (y * this.finalCanvas.width) + x;

                    // eslint-disable-next-line max-depth
                    if (segmentation.data[n] === 0) {
                        dataL[n * 4] = blurData.data[n * 4];
                        dataL[(n * 4) + 1] = blurData.data[(n * 4) + 1];
                        dataL[(n * 4) + 2] = blurData.data[(n * 4) + 2];
                        dataL[(n * 4) + 3] = blurData.data[(n * 4) + 3];
                    }
                }
            }
        }
        ctx.putImageData(liveData, 0, 0);
    }

    /**
     * Adjust settings to existing BlurEffect.
     *
     * @param {boolean} blur - Do you want to blur?
     * @returns {void}
     */
    setNewSettings(blur: boolean) {
        this.blur = blur;
    }

    /**
     * Get the stream.
     *
     * @returns {MediaStream}
     */
    getStream() {
        if (!this.outStream) {
            this.outStream = this.finalCanvas.captureStream();
        }

        return this.outStream;
    }
}
