// @flow

// import { JEELIZFACEFILTER, NN_DEFAULT } from 'facefilter';
// import * as THREE from 'three';

import {
    CLEAR_TIMEOUT,
    TIMEOUT_TICK,
    SET_TIMEOUT,
    timerWorkerScript
} from './TimerWorker';
import { TRIANGULATION } from './utils/Triangulations';

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
        this._outputCanvasElement.getContext('2d');
        this._outputCanvasElement.id = 'outputCanvas';
        this._inputVideoElement = document.createElement('video');
    }

    /**
     * To do.
     *
     * @returns {void}
     */
    // main() {
    //     const track = this._stream.getVideoTracks()[0];
    //     const { height, width } = track.getSettings() ?? track.getConstraints();
    //     const gl = document.createElement('canvas').getContext('webgl2');


    //     if (gl) {
    //         console.log('webgl2 works!');
    //     } else {
    //         console.log('your browser/OS/drivers do not support WebGL2');
    //     }

    //     this._outputCanvasElement.height = height;
    //     this._outputCanvasElement.width = width;
    //     this._outputCanvasCtx.drawImage(this._inputVideoElement, 0, 0);
    //     console.log('CANVAS', this._outputCanvasElement.getBoundingClientRect());
    //     JeelizResizer.size_canvas({
    //         canvas: this._outputCanvasElement,
    //         callback: function() {
    //             this.initFaceFilter();
    //         }.bind(this)
    //     });
    // }

    /**
     * To do.
     *
     * @returns {void}
     */
    // initFaceFilter(): void {
    //     console.log('initFaceFilter');
    //     JEELIZFACEFILTER.init({
    //         followZRot: true,
    //         canvas: this._outputCanvasElement,
    //         NNC: NN_DEFAULT, // root of NN_DEFAULT.json file
    //         maxFacesDetected: 1,
    //         callbackReady: this._callbackReady,
    //         callbackTrack: this._callbackTrack
    //     });
    // }

    /**
     * The ready callback function.
     *
     * @param  {number} errCode - To do.
     * @param  {Object} spec - To do.
     * @returns {void}.
     */
    // _callbackReady(errCode: number, spec: Object): void {
    //     if (errCode) {
    //         console.log('AN ERROR HAPPENS. ERR =', errCode);

    //         return;
    //     }

    //     console.log('INFO: JEELIZFACEFILTER IS READY');
    //     this.initThreeScene(spec);
    // }

    /**
     * The ready callback function.
     *
     * @param  {Object} spec - To do.
     * @returns {void}.
     */
    // initThreeScene(spec: any) {
    //     console.log('INFO: three spec');
    //     const threeStuffs = JeelizThreeHelper.init(spec, this.detectCallback);

    //     // CREATE A CUBE
    //     const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    //     const cubeMaterial = new THREE.MeshNormalMaterial();
    //     const threeCube = new THREE.Mesh(cubeGeometry, cubeMaterial);

    //     threeCube.frustumCulled = false;
    //     threeStuffs.faceObject.add(threeCube);

    //     // CREATE THE CAMERA
    //     this._threeCamera = JeelizThreeHelper.create_camera();
    // } // end init_threeScene()

    /**
     * To do.
     *
     * @param  {number} faceIndex - To do.
     * @param  {boolean} isDetected - To do.
     * @returns {void}
     */
    // detectCallback(faceIndex: number, isDetected: boolean) {
    //     if (isDetected) {
    //         console.log('INFO in detect_callback(): DETECTED');
    //     } else {
    //         console.log('INFO in detect_callback(): LOST');
    //     }
    // }

    /**
     * The track callback function.
     *
     * @param {Object} detectState - Something.
     * @returns {void}.
     */
    // _callbackTrack(detectState: Object): void {
    //     // if 1 face detection, wrap in an array
    //     JeelizThreeHelper.render(detectState, this._threeCamera);
    // }

    drawPath = (ctx: Object, points: Object, closePath: boolean) => {
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
    drawMesh(predictions: Array<Object>, ctx: Object) {
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
                    this.drawPath(ctx, points, true);
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
     * Loop function to render the background mask.
     *
     * @private
     * @returns {void}
     */
    _renderMask() {
        const track = this._stream.getVideoTracks()[0];
        const { height, width } = track.getSettings() ?? track.getConstraints();

        this._outputCanvasElement.height = height;
        this._outputCanvasElement.width = width;
        this._outputCanvasCtx.drawImage(this._inputVideoElement, 0, 0);
        this._net.estimateFaces({ input: this._inputVideoElement }).then(face => {
            console.log(face);
            this.drawMesh(face, this._outputCanvasCtx);
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

        // this._segmentationMask = new ImageData(this._options.width, this._options.height);
        // this._segmentationMaskCanvas = document.createElement('canvas');
        // this._segmentationMaskCanvas.width = this._options.width;
        // this._segmentationMaskCanvas.height = this._options.height;
        // this._segmentationMaskCtx = this._segmentationMaskCanvas.getContext('2d');

        this._outputCanvasElement.width = parseInt(width, 10);
        this._outputCanvasElement.height = parseInt(height, 10);
        this._outputCanvasCtx = this._outputCanvasElement.getContext('2d');
        this._inputVideoElement.width = parseInt(width, 10);
        this._inputVideoElement.height = parseInt(height, 10);
        this._inputVideoElement.autoplay = true;
        this._inputVideoElement.srcObject = this._stream;

        // this.main();

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
