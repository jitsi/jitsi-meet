// @flow

// import { JEELIZFACEFILTER, NN_DEFAULT } from 'facefilter';

import {
    CLEAR_TIMEOUT,
    TIMEOUT_TICK,
    SET_TIMEOUT,
    timerWorkerScript
} from './TimerWorker';
import FacePaint from './utils/FacePaint';
import { TRIANGULATION } from './utils/Triangulation';

// import { JeelizResizer } from './utils/JeelizResizer';
// import { JeelizThreeHelper } from './utils/JeelizThreeHelper';


/**
 * Represents a modified MediaStream that adds an avatar to people's faces in the video
 * <tt>JitsiVideoAvatarEffect</tt> does the processing of the original
 * video stream.
 */
export default class JitsiVideoAvatarEffect {
    _options: Object;
    _stream: Object;
    _segmentationPixelCount: number;
    _inputVideoElement: HTMLVideoElement;
    _onMaskFrameTimer: Function;
    _maskFrameTimerWorker: Worker;
    _outputCanvasElement: HTMLCanvasElement;
    _outputCanvasCtx: Object;
    _segmentationMaskCtx: Object;
    _segmentationMask: Object;
    _segmentationMaskCanvas: Object;
    _renderMask: Function;
    _virtualImage: HTMLImageElement;
    _virtualVideo: HTMLVideoElement;
    isEnabled: Function;
    startEffect: Function;
    stopEffect: Function;
    _threeCamera: Object;
    _net: Object;
    _faceCanvas: Object;

    /**
     * Represents a modified video MediaStream track.
     *
     * @param {Object} net - TF model.
     */
    constructor(net: Object) {
        // this._threeCamera = null;
        this._net = net;
        this._onMaskFrameTimer = this._onMaskFrameTimer.bind(this);

        this._outputCanvasElement = document.createElement('canvas');
        this._inputVideoElement = document.createElement('video');
    }

    /**
     * Draw a triangle map on detected face.
     *
     * @param {Object} ctx - To do.
     * @param {Object} points - To do.
     * @param {boolean} closePath - To do.
     * @returns {void}.
     */
    _drawPath = (ctx: Object, points: Object, closePath: boolean) => {
        const region = new Path2D();

        region.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            const point = points[i];

            region.lineTo(point[0], point[1]);
        }

        if (closePath) {
            region.closePath();
        }
        ctx.strokeStyle = 'red';
        ctx.stroke(region);
    };

    /**
     * Draw a mesh.
     *
     * @param  {Array<Object>} predictions - Face predictions.
     * @param  {Object} ctx - Canvas context.
     * @returns {void}
     */
    _drawMesh(predictions: Array<Object>, ctx: Object) {
        if (predictions.length > 0) {
            predictions.forEach(prediction => {
                const keypoints = prediction.scaledMesh;

                for (let i = 0; i < TRIANGULATION.length / 3; i++) {
                    // Get sets of three keypoints for the triangle
                    const points = [
                        TRIANGULATION[i * 3],
                        TRIANGULATION[(i * 3) + 1],
                        TRIANGULATION[(i * 3) + 2]
                    ].map(index => keypoints[index]);

                    //  Draw triangle
                    this._drawPath(ctx, points, true);
                }

                // Draw Dots
                for (let i = 0; i < keypoints.length; i++) {
                    const x = keypoints[i][0];
                    const y = keypoints[i][1];

                    ctx.beginPath();
                    ctx.arc(x, y, 1 /* radius */, 0, 3 * Math.PI);
                    ctx.fillStyle = 'red';
                    ctx.fill();
                }
            });
        }
    }

    /**
     * Draw a canvas with mask and background.
     *
     * @param  {Array<Object>} predictions - Face predictions.
     * @param {number} height - Height.
     * @param {number} width - Width.
     * @returns {void}
     */
    _drawCanvas(predictions: Array<Object>, height: number, width: number) {

        if (predictions.length > 0) {
            const positionBufferData = predictions[0].scaledMesh.reduce((acc, pos) => acc.concat(pos), []);

            if (!this._faceCanvas) {
                this._faceCanvas = new FacePaint(this._outputCanvasElement,
                                                this._inputVideoElement,
                                                width,
                                                height);
            }
            this._faceCanvas.render(positionBufferData);
        }
    }

    /**
     * Loop function to render the background mask.
     *
     * @private
     * @returns {void}
     */
    _renderMask() {
        const track = this._stream.getVideoTracks()[0];
        const { height, width } = track.getSettings() ?? track.getConstraints();

        // this._outputCanvasElement.height = height;
        // this._outputCanvasElement.width = width;

        // this._outputCanvasCtx.drawImage(this._inputVideoElement, 0, 0);
        this._net.estimateFaces({ input: this._inputVideoElement }).then(face => {
            this._drawCanvas(face, height, width);
        });

        this._maskFrameTimerWorker.postMessage({
            id: SET_TIMEOUT,
            timeMs: 1000 / 30
        });
    }

    /**
     * EventHandler onmessage for the maskFrameTimerWorker WebWorker.
     *
     * @private
     * @param {EventHandler} response - The onmessage EventHandler parameter.
     * @returns {void}
     */
    _onMaskFrameTimer(response: Object) {
        if (response.data.id === TIMEOUT_TICK) {
            this._renderMask();
        }
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
        this._stream = stream;
        this._maskFrameTimerWorker = new Worker(timerWorkerScript, { name: 'Blur effect worker' });
        this._maskFrameTimerWorker.onmessage = this._onMaskFrameTimer;
        const firstVideoTrack = this._stream.getVideoTracks()[0];
        const { height, frameRate, width }
            = firstVideoTrack.getSettings ? firstVideoTrack.getSettings() : firstVideoTrack.getConstraints();

        this._outputCanvasElement.width = parseInt(width, 10);
        this._outputCanvasElement.height = parseInt(height, 10);
        this._inputVideoElement.width = parseInt(width, 10);
        this._inputVideoElement.height = parseInt(height, 10);
        this._inputVideoElement.autoplay = true;
        this._inputVideoElement.srcObject = this._stream;

        this._inputVideoElement.onloadeddata = () => {
            this._maskFrameTimerWorker.postMessage({
                id: SET_TIMEOUT,
                timeMs: 1000 / 30
            });
        };

        return this._outputCanvasElement.captureStream(parseInt(frameRate, 10));
    }

    /**
     * Stops the capture and render loop.
     *
     * @returns {void}
     */
    stopEffect() {
        this._maskFrameTimerWorker.postMessage({
            id: CLEAR_TIMEOUT
        });

        this._maskFrameTimerWorker.terminate();
    }

}
