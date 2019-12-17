// @flow

import * as bodyPix from '@tensorflow-models/body-pix';

/**
 * Represents a modified MediaStream that adds blur to video background.
 * <tt>JitsiStreamBlurEffect</tt> does the processing of the original
 * video stream.
 */
export default class JitsiStreamBlurEffect {
    _bpModel: Object;
    _inputVideoElement: HTMLVideoElement;
    _outputCanvasElement: HTMLCanvasElement;
    _personSegmentation: Object;
    _personSegmentationFrame: Function;
    _requestId: AnimationFrameID;
    isEnabled: Function;
    startEffect: Function;
    stopEffect: Function;

    /**
     * Represents a modified video MediaStream track.
     *
     * @class
     * @param {BodyPix} bpModel - BodyPix model.
     */
    constructor(bpModel: Object) {
        this._bpModel = bpModel;
        this._outputCanvasElement = document.createElement('canvas');
        this._outputCanvasElement.getContext('2d');
        this._inputVideoElement = document.createElement('video');

        // Bind event handler so it is only bound once for every instance.
        this._personSegmentationFrame = this._personSegmentationFrame.bind(this);
    }

    /**
     * Calculates the person segmentation mask for a given video input and draws the image with
     * the blur effect for the background on a canvas.
     *
     * @returns {void}
     */
    async _personSegmentationFrame() {
        this._personSegmentation = await this._bpModel.segmentPerson(this._inputVideoElement, {
            internalResolution: 'low', // resized to 0.25 times of the original resolution before inference
            maxDetections: 1, // max. number of person poses to detect per image
            segmentationThreshold: 0.7 // represents probability that a pixel belongs to a person
        });
        if (this._personSegmentation) {
            bodyPix.drawBokehEffect(
                this._outputCanvasElement,
                this._inputVideoElement,
                this._personSegmentation,
                7, // Constant for background blur, integer values between 0-20
                7 // Constant for edge blur, integer values between 0-20
            );
        }
        this._requestId = requestAnimationFrame(this._personSegmentationFrame);
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
     * Starts loop to capture video frame and render the segmentation mask.
     *
     * @param {MediaStream} stream - Stream to be used for processing.
     * @returns {MediaStream} - The stream with the applied effect.
     */
    startEffect(stream: MediaStream) {
        const firstVideoTrack = stream.getVideoTracks()[0];
        const { height, frameRate, width }
            = firstVideoTrack.getSettings ? firstVideoTrack.getSettings() : firstVideoTrack.getConstraints();

        this._outputCanvasElement.width = parseInt(width, 10);
        this._outputCanvasElement.height = parseInt(height, 10);

        this._inputVideoElement.width = parseInt(width, 10);
        this._inputVideoElement.height = parseInt(height, 10);
        this._inputVideoElement.autoplay = true;
        this._inputVideoElement.srcObject = stream;
        this._inputVideoElement.onloadeddata = () => {
            this._personSegmentationFrame();
        };

        return this._outputCanvasElement.captureStream(parseInt(frameRate, 10));
    }

    /**
     * Stops the capture and render loop.
     *
     * @returns {void}
     */
    stopEffect() {
        cancelAnimationFrame(this._requestId);
    }
}


