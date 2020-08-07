// @flow

import * as bodyPix from '@tensorflow-models/body-pix';
import * as StackBlur from 'stackblur-canvas';


const segmentationProperties = {
    flipHorizontal: false,
    internalResolution: "medium",
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
    bpModel; // bodyPix.BodyPix
    stream; // MediaStream

    tmpVideo = document.createElement("video");

    videoRenderCanvas = document.createElement("canvas");
    videoRenderCanvasCtx = this.videoRenderCanvas.getContext('2d');

    bodyPixCanvas = document.createElement("canvas");
    bodyPixCtx = this.bodyPixCanvas.getContext('2d');

    finalCanvas = document.createElement("canvas");

    previousSegmentationComplete = true;
    lastSegmentation = null; // bodyPix.SemanticPersonSegmentation | null

    // worker: Worker;
    shouldContinue = true;

    imageData = null; //  ImageData | null
    blur = false; // boolean
    outStream = null; // MediaStream | null


    /**
     * Represents a modified video MediaStream track.
     *
     * @class
     * @param {bodyPix.BodyPix} bpModel - BodyPix model.

     */
    constructor(bpModel) {
        this.bpModel = bpModel;
    }

    /**
     * Starts loop to capture video frame and render the segmentation mask.
     *
     * @param {MediaStream} stream - Stream to be used for processing.
     * @param {boolean} blur
     * @param {HTMLImageElement | undefined} image
     * @returns {MediaStream} - The stream with the applied effect.
     */
    startEffect(stream, blur = true, image) {
        this.stream = stream;

        this.blur = blur;

        this.tmpVideo.addEventListener('loadedmetadata', () => {
            this.setNewSettings(blur, image);
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
    }


    /**
     * Stops the capture and render loop.
     *
     * @returns {void}
     */
    stopEffect() {
        this.shouldContinue = false;
    }

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
        if(this.shouldContinue){
            setTimeout(this.tick.bind(this), 1000 / 60)
        }
    }

    /**
     *
     * @param {bodyPix.SemanticPersonSegmentation | null} segmentation
     */
    processSegmentation(segmentation) {
        const ctx = this.finalCanvas.getContext('2d');
        const liveData = this.videoRenderCanvasCtx.getImageData(0, 0, this.videoRenderCanvas.width, this.videoRenderCanvas.height);
        if (segmentation) {
            if (this.blur) {
                const blurData = new ImageData(liveData.data.slice(), liveData.width, liveData.height);
                StackBlur.imageDataRGB(blurData, 0, 0, liveData.width, liveData.height, 12);
                const dataL = liveData.data;
                for (let x = 0; x < this.finalCanvas.width; x++) {
                    for (let y = 0; y < this.finalCanvas.height; y++) {
                        let n = y * this.finalCanvas.width + x;
                        if (segmentation.data[n] === 0) {
                            dataL[n * 4] =  blurData.data[n * 4];
                            dataL[n * 4 + 1] = blurData.data[n * 4 + 1];
                            dataL[n * 4 + 2] = blurData.data[n * 4 + 2];
                            dataL[n * 4 + 3] = blurData.data[n * 4 + 3];
                        }
                    }
                }
            }
            if(this.imageData) {
                const dataL = liveData.data;
                for (let x = 0; x < this.finalCanvas.width; x++) {
                    for (let y = 0; y < this.finalCanvas.height; y++) {
                        let n = y * this.finalCanvas.width + x;
                        if (segmentation.data[n] === 0) {
                            dataL[n * 4] = this.imageData.data[n * 4];
                            dataL[n * 4 + 1] = this.imageData.data[n * 4 + 1];
                            dataL[n * 4 + 2] = this.imageData.data[n * 4 + 2];
                            dataL[n * 4 + 3] = this.imageData.data[n * 4 + 3];
                        }
                    }
                }
            }
        }
        ctx.putImageData(liveData, 0, 0)
    }

    /**
     *
     * @param {boolean} blur
     * @param {HTMLImageElement | undefined} image
     */
    setNewSettings(blur, image){
        if (blur && image) {
            throw "I can't blur and replace image...well I can...but that would be stupid."
        }
        this.blur = blur;
        if(image){
            this.generateImageData(image);
        } else {
            this.imageData = null;
        }
    }

    /**
     *
     * @param {HTMLImageElement} img
     */
    generateImageData(img) {
        /**
         * https://stackoverflow.com/a/21961894/7886229
         * By Ken Fyrstenberg Nilsen
         *
         * drawImageProp(context, image [, x, y, width, height [,offsetX, offsetY]])
         *
         * If image and context are only arguments rectangle will equal canvas
         */
        const canvas = document.createElement('canvas');
        canvas.height = this.tmpVideo.videoHeight;
        canvas.width = this.tmpVideo.videoWidth;
        const ctx = canvas.getContext('2d');
        const x = 0;
        const y = 0;
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        const offsetX = 0.5;
        const offsetY = 0.5;

        const iw = img.width;
        const ih = img.height;
        const r = Math.min(w / iw, h / ih);
        let nw = iw * r;   // new prop. width
        let nh = ih * r;  // new prop. height
        let cx, cy, cw, ch, ar = 1;

        // decide which gap to fill
        if (nw < w) ar = w / nw;
        if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;  // updated
        nw *= ar;
        nh *= ar;

        // calc source rectangle
        cw = iw / (nw / w);
        ch = ih / (nh / h);

        cx = (iw - cw) * offsetX;
        cy = (ih - ch) * offsetY;

        // make sure source rectangle is valid
        if (cx < 0) cx = 0;
        if (cy < 0) cy = 0;
        if (cw > iw) cw = iw;
        if (ch > ih) ch = ih;

        // fill image in dest. rectangle
        ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);

        this.imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    getStream() {
        if(!this.outStream){
            this.outStream = this.finalCanvas.captureStream();
        }
        return this.outStream;
    }
}
