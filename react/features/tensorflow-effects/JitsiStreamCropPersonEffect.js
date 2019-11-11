import {
    CLEAR_INTERVAL,
    INTERVAL_TIMEOUT,
    SET_INTERVAL,
    timerWorkerScript
} from './TimerWorker';

/**
 * Represents a modified MediaStream that adds mask to video background.
 * <tt>JitsiStreamCropEffect</tt> does the processing of the original
 * video stream.
 */
export default class JitsiStreamCropPersonEffect {
    /**
     * Represents a modified video MediaStream track.
     *
     * @class
     * @param {BodyPix} bpModel - BodyPix model.
     * @param {MediaStream} stream - The video stream on which crop is applied.
     */
    constructor(bpModel, stream) {
        this._bpModel = bpModel;
        this._videoStream = stream;
        const videoTrack = stream.getVideoTracks()[0];

        // Bind event handler so it is only bound once for every instance.
        this._onMaskFrameTimer = this._onMaskFrameTimer.bind(this);
        this._onVideoFrameTimer = this._onVideoFrameTimer.bind(this);
        this._outputCanvasElement = document.createElement('canvas');

        // Workaround for FF issue
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1388974
        this._ctx = this._outputCanvasElement.getContext('2d');

        this._maskCanvasElement = document.createElement('canvas');
        this._inputVideoElement = document.createElement('video');
        this._inputDesktopElement = document.createElement('video');

        // get the stream properties for the camera and set the
        // properties of the input video element.
        this._cameraWidth = videoTrack.getSettings().width;
        this._cameraHeight = videoTrack.getSettings().height;
        this._cameraFrameRate = videoTrack.getSettings().frameRate;
        this._inputVideoElement.width = this._cameraWidth;
        this._inputVideoElement.height = this._cameraHeight;
        this._inputVideoElement.autoplay = true;
        this._inputVideoElement.srcObject = stream;

        this._videoFrameTimerWorker = new Worker(timerWorkerScript);
        this._maskFrameTimerWorker = new Worker(timerWorkerScript);
        this._videoFrameTimerWorker.onmessage = this._onVideoFrameTimer;
        this._maskFrameTimerWorker.onmessage = this._onMaskFrameTimer;
    }

    /**
     * EventHandler onmessage for the videoFrameTimerWorker WebWorker.
     *
     * @private
     * @param {EventHandler} response - The onmessage EventHandler parameter.
     * @returns {void}
     */
    _onVideoFrameTimer(response) {
        if (response.data.id === INTERVAL_TIMEOUT) {
            this._renderVideo();
        }
    }

    /**
     * EventHandler onmessage for the maskFrameTimerWorker WebWorker.
     *
     * @private
     * @param {EventHandler} response - The onmessage EventHandler parameter.
     * @returns {void}
     */
    _onMaskFrameTimer(response) {
        if (response.data.id === INTERVAL_TIMEOUT) {
            this._renderMask();
        }
    }

    /**
     * Starts loop to capture video frame and render the segmentation mask.
     *
     * @param {MediaStream} desktopStream - Stream to be used for processing.
     * @returns {MediaStream} - The stream with the applied effect.
     */
    startEffect(desktopStream) {

        // get the stream properties for the screenshare.
        const desktopTrack = desktopStream.getVideoTracks()[0];
        const { height, frameRate, width }
            = desktopTrack.getSettings ? desktopTrack.getSettings()
                : desktopTrack.getConstraints();
        const videoDiv = document.createElement('div');

        this._height = height;
        this._width = width;
        this._frameRate = frameRate;
        this._inputDesktopElement.width = width;
        this._inputDesktopElement.height = height;
        this._inputDesktopElement.autoplay = true;
        this._inputDesktopElement.srcObject = desktopStream;

        document.body.appendChild(videoDiv);
        videoDiv.appendChild(this._inputVideoElement);
        videoDiv.appendChild(this._inputDesktopElement);

        // set the style attribute of the div to make it invisible
        videoDiv.style.display = 'none';

        this._maskCanvasElement.width = this._cameraWidth;
        this._maskCanvasElement.height = this._cameraHeight;
        this._maskCanvasContext = this._maskCanvasElement.getContext('2d');
        this._outputCanvasElement.width = this._width;
        this._outputCanvasElement.height = this._height;

        this._videoFrameTimerWorker.postMessage({
            id: SET_INTERVAL,
            timeMs: 1000 / this._cameraFrameRate
        });
        this._maskFrameTimerWorker.postMessage({
            id: SET_INTERVAL,
            timeMs: 50
        });

        return this._outputCanvasElement.captureStream(this._cameraFrameRate);
    }

    /**
     * Stops the capture and render loop.
     *
     * @returns {void}
     */
    stopEffect() {
        this._videoFrameTimerWorker.postMessage({
            id: CLEAR_INTERVAL
        });
        this._maskFrameTimerWorker.postMessage({
            id: CLEAR_INTERVAL
        });
    }

    /**
     * Loop function to render the canvas and draw the crop effect.
     *
     * @private
     * @returns {void}
     */
    _renderVideo() {
        this._maskCanvasContext.drawImage(this._inputVideoElement, 0, 0,
            this._cameraWidth, this._cameraHeight);
        if (this._segmentationData) {
            const img = this._maskCanvasContext.getImageData(0, 0,
                this._cameraWidth, this._cameraHeight);
            const pixels = img.data;
            const data = this._segmentationData.data;

            for (let i = 0; i < data.length; i++) {
                // if the pixel doesn't belong to the person, set the
                // alpha channel value to 0 to make it transparent.
                pixels[(i * 4) + 3] = data[i] === 0 ? 0 : 255;
            }
            this._maskCanvasContext.putImageData(img, 0, 0);
        }
        this._ctx.drawImage(this._inputDesktopElement, 0, 0, this._width,
            this._height);
        this._ctx.drawImage(this._maskCanvasElement, this._width - this._cameraWidth,
            this._height - this._cameraHeight, this._cameraWidth, this._cameraHeight);
    }

    /**
     * Loop function to render the background mask.
     *
     * @private
     * @returns {void}
     */
    _renderMask() {
        this._bpModel.estimatePersonSegmentation(
            this._inputVideoElement,
            8, // Chose 32 for better performance
            0.55 // Represents probability that a pixel belongs to a person
        )
        .then(value => {
            this._segmentationData = value;
        });
    }

    /**
     * Checks if the local track supports this effect.
     *
     * @param {JitsiLocalTrack} jitsiLocalTrack - Track to apply effect.
     * @returns {boolean} - Returns true if this effect can run on the specified track
     * false otherwise.
     */
    isEnabled(jitsiLocalTrack) {
        return jitsiLocalTrack.isVideoTrack() && jitsiLocalTrack.videoType === 'desktop';
    }
}
