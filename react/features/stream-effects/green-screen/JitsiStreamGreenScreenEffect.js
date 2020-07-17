// @flow

import * as bodyPix from '@tensorflow-models/body-pix';
import type { Dispatch } from 'redux';

/**
 * Represents a modified MediaStream that adds a green screen to video background.
 * <tt>JitsiStreamGreenScreenEffect</tt> does the processing of the original
 * video stream.
 */
export default class JitsiStreamGreenScreenEffect {
    _algorithmType: string;
    _bpModel: Object;
    _chromaKey: Object;
    _chromaThreshold: number;
    _canvas: HTMLCanvasElement;
    _ctx: CanvasRenderingContext2D;
    _dispatch: Function;
    _fps: number;
    _getState: Function;
    _inputVideoElement: HTMLVideoElement;
    _internalResolution: string;
    _matchChroma: Function;
    _maskInProgress: boolean;
    _outputCanvasElement: HTMLCanvasElement;
    _renderBP: Function;
    _renderChromaKey: Function;
    _renderMask: Function;
    _requestAnimationFrame: number | typeof undefined;
    _requiresResize: Function;
    _resizeInProgress: boolean;
    _resizeMask: Function;
    init: Function;
    isEnabled: Function;
    startEffect: Function;
    stopEffect: Function;

    /**
     * Represents a modified video MediaStream track.
     *
     * @class
     * @param {Function} getState - GetState function.
     * @param {Function} dispatch - Dispatch function.
     */
    constructor(getState: Function, dispatch: Dispatch<any>) {
        this._getState = getState;
        this._dispatch = dispatch;

        // Workaround for FF issue https://bugzilla.mozilla.org/show_bug.cgi?id=1388974
        this._outputCanvasElement = document.createElement('canvas');
        this._outputCanvasElement.getContext('2d');
        this._inputVideoElement = document.createElement('video');
    }

    /**
     * Initializes green screen effect instance.
     *
     * @returns {Promise<void>}
     */
    async init() {
        const {
            algorithmType,
            outputStride,
            multiplier,
            quantBytes,
            chromaKey,
            chromaThreshold,
            fps,
            internalResolution
        } = this._getState()['features/green-screen/settings'];

        this._algorithmType = algorithmType;
        this._fps = fps;
        this._internalResolution = internalResolution;

        if (algorithmType === 'chroma') {
            this._chromaKey = chromaKey || { r: 0,
                g: 255,
                b: 0 };
            this._chromaThreshold = chromaThreshold || 100;

            this._canvas = document.createElement('canvas');
            this._ctx = this._canvas.getContext('2d');
        } else {
            const options: {
                architecture: string,
                outputStride: number,
                quantBytes: number,
                multiplier?: number,
            } = {
                architecture: algorithmType === 'resNet' ? 'ResNet50' : 'MobileNetV1',
                outputStride: outputStride || 16,
                quantBytes: quantBytes || 2
            };

            if (options.architecture === 'MobileNetV1') {
                options.multiplier = multiplier || 0.75;
            }

            this._bpModel = await bodyPix.load(options);
        }
    }

    /**
     * Loop function to render the background mask.
     *
     * @private
     * @returns {void}
     */
    async _renderMask() {
        let maskData, state;

        if (this._getState) {
            state = this._getState();

            maskData = state['features/green-screen/mask'] && state['features/green-screen/mask'].data;
        }

        if (this._requiresResize(maskData)) {
            // Don't await this promise, it would hang the video
            // Instead, set data to undefined, on slower machines, this could result in a temporary green background
            this._resizeMask(maskData);

            maskData = undefined;
        }

        if (this._algorithmType === 'chroma') {
            this._renderChromaKey(state, maskData);
        } else {
            await this._renderBP(state, maskData);
        }
    }

    /**
     * Renders the chroma key green screen effect.
     *
     * @param {Object|undefined} state - State object.
     * @param {ImageData|undefined} maskData - An ImageData object.
     * @returns {void}
     */
    _renderChromaKey(state, maskData) {
        this._canvas.width = this._inputVideoElement.width;
        this._canvas.height = this._inputVideoElement.height;

        this._ctx.drawImage(
            this._inputVideoElement,
            0,
            0,
            this._inputVideoElement.width,
            this._inputVideoElement.height
        );

        const frameData = this._ctx.getImageData(0, 0, this._inputVideoElement.width, this._inputVideoElement.height);

        if (state && state['features/green-screen/settings']) {
            this._chromaKey = state['features/green-screen/settings'].chromaKey || this._chromaKey;
            this._chromaThreshold = state['features/green-screen/settings'].chromaThreshold || this._chromaThreshold;
        }

        if (maskData) {
            for (let i = 0; i < frameData.data.length; i += 4) {
                const r = i;
                const g = i + 1;
                const b = i + 2;

                if (this._matchChroma(frameData.data[r], frameData.data[g], frameData.data[b])) {
                    frameData.data[r] = maskData.data[r];
                    frameData.data[g] = maskData.data[g];
                    frameData.data[b] = maskData.data[b];
                }
            }

            this._outputCanvasElement.getContext('2d').putImageData(frameData, 0, 0);
        }
    }

    /**
     * Renders the bodyPix powered green screen effect.
     *
     * @param {Object|undefined} state - State object.
     * @param {ImageData|undefined} maskData - An ImageData object.
     * @returns {Promise<void>}
     */
    async _renderBP(state, maskData) {
        const segmentationData = await this._bpModel.segmentPerson(this._inputVideoElement, {
            internalResolution: this._internalResolution,
            maxDetections: 1,
            segmentationThreshold: 0.6
        });

        const mask = bodyPix.toMask(segmentationData, { r: 0,
            g: 0,
            b: 0,
            a: 0 }, { r: 0,
            g: 255,
            b: 0,
            a: 255 });

        if (maskData) {
            for (let i = 0; i < mask.data.length; i += 4) {
                const r = i;
                const g = i + 1;
                const b = i + 2;
                const a = i + 3;

                if (mask.data[g] === 255 && mask.data[a] === 255) {
                    mask.data[r] = maskData.data[r];
                    mask.data[g] = maskData.data[g];
                    mask.data[b] = maskData.data[b];
                    mask.data[a] = maskData.data[a];
                }
            }
        }

        bodyPix.drawMask(
            this._outputCanvasElement,
            this._inputVideoElement,
            mask,
            1, // opacity
            0, // blur amount
            false // flip horizontally
        );
    }

    /**
     * Test if passed in rgb matches configured green screen chroma.
     *
     * @param {number} r - R component of rgb.
     * @param {number} g - G component of rgb.
     * @param {number} b - B component of rgb.
     * @returns {boolean}
     */
    _matchChroma(r, g, b) {
        const rmean = (this._chromaKey.r + r) / 2;

        const rD = this._chromaKey.r - r;
        const gD = this._chromaKey.g - g;
        const bD = this._chromaKey.b - b;

        return Math.sqrt(
            // eslint-disable-next-line no-bitwise
            (((512 + rmean) * rD * rD) >> 8)
            + (4 * gD * gD)
            // eslint-disable-next-line no-bitwise
            + (((767 - rmean) * bD * bD) >> 8)
        ) <= this._chromaThreshold;
    }

    /**
     * Test if maskData needs to be resized.
     *
     * @param {ImageData|undefined} maskData - ImageData object.
     * @returns {boolean}
     */
    _requiresResize(maskData) {
        return maskData && this._dispatch && (
            maskData.width !== this._inputVideoElement.width
            || maskData.height !== this._inputVideoElement.height
        );
    }

    /**
     * Resize stored maskData, update settings when done.
     *
     * @param {ImageData} maskData - ImageData object to be resized.
     * @returns {Promise<void>}
     */
    async _resizeMask(maskData) {
        if (this._resizeInProgress) {
            return;
        }

        this._resizeInProgress = true;

        const resizeCanvas = document.createElement('canvas');
        const resizeCtx = resizeCanvas.getContext('2d');

        resizeCanvas.width = this._inputVideoElement.width;
        resizeCanvas.height = this._inputVideoElement.height;

        // $FlowFixMe
        const imgBitmap = await createImageBitmap(maskData);

        resizeCtx.drawImage(imgBitmap, 0, 0, resizeCanvas.width, resizeCanvas.height);

        this._dispatch({
            type: 'GREEN_SCREEN_MASK_UPDATED',
            data: resizeCtx.getImageData(0, 0, resizeCanvas.width, resizeCanvas.height)
        });

        this._resizeInProgress = false;
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
            const spf = 1000 / this._fps;
            let lastTimestamp = 0;
            const step = async timestamp => {
                if (timestamp - lastTimestamp > spf) {
                    lastTimestamp = timestamp;

                    if (!this._maskInProgress) {
                        this._maskInProgress = true;

                        await this._renderMask();

                        this._maskInProgress = false;
                    }
                }

                this._requestAnimationFrame = window.requestAnimationFrame(step);
            };

            this._requestAnimationFrame = window.requestAnimationFrame(step);
        };

        return this._outputCanvasElement.captureStream(parseInt(frameRate, 10));
    }

    /**
     * Stops the capture and render loop.
     *
     * @returns {void}
     */
    stopEffect() {
        if (this._requestAnimationFrame) {
            window.cancelAnimationFrame(this._requestAnimationFrame);

            this._requestAnimationFrame = undefined;
        }
    }
}
