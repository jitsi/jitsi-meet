import {
    CLEAR_INTERVAL,
    INTERVAL_TIMEOUT,
    SET_INTERVAL,
    timerWorkerScript
} from './TimerWorker';

/**
 * Represents a modified MediaStream that adds video as pip on a desktop stream.
 * <tt>JitsiStreamPresenterEffect</tt> does the processing of the original
 * desktop stream.
 */
export default class JitsiStreamPresenterEffect {

    /**
     * Represents a modified MediaStream that adds a camera track at the
     * bottom right corner of the desktop track using a HTML canvas.
     * <tt>JitsiStreamCanvasEffect</tt> does the processing of the original
     * video stream.
     *
     * @param {MediaStream} videoStream - The video stream which is user for
     * creating the canvas.
     */
    constructor(videoStream) {
        const videoDiv = document.createElement('div');
        const firstVideoTrack = videoStream.getVideoTracks()[0];
        const { height, width, frameRate } = firstVideoTrack.getSettings
            ? firstVideoTrack.getSettings()
            : firstVideoTrack.getConstraints();

        this._canvas = document.createElement('canvas');

        // Workaround for FF issue
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1388974
        this._ctx = this._canvas.getContext('2d');
        document.body.appendChild(this._canvas);

        this._desktopElement = document.createElement('video');
        this._videoElement = document.createElement('video');
        document.body.appendChild(videoDiv);
        videoDiv.appendChild(this._videoElement);
        videoDiv.appendChild(this._desktopElement);

        // Set the video element properties
        this._frameRate = frameRate;
        this._videoHeight = height;
        this._videoWidth = width;
        this._videoElement.width = width;
        this._videoElement.height = height;
        this._videoElement.autoplay = true;
        this._videoElement.srcObject = videoStream;

        // set the style attribute of the div to make it invisible
        videoDiv.style.display = 'none';

        // Bind event handler so it is only bound once for every instance.
        this._onVideoFrameTimer = this._onVideoFrameTimer.bind(this);
        this._videoFrameTimerWorker = new Worker(timerWorkerScript);
        this._videoFrameTimerWorker.onmessage = this._onVideoFrameTimer;
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
     * Loop function to render the video frame input and draw presenter effect.
     *
     * @private
     * @returns {void}
     */
    _renderVideo() {
        this._ctx.drawImage(this._desktopElement, 0, 0, this._desktopWidth, this._desktopHeight);
        this._ctx.drawImage(this._videoElement, this._desktopWidth - this._videoWidth,
            this._desktopHeight - this._videoHeight, this._videoWidth, this._videoHeight);

        // draw a border around the video element.
        this._ctx.beginPath();
        this._ctx.lineWidth = '2';
        this._ctx.strokeStyle = '#0376DA';
        this._ctx.rect(this._desktopWidth - this._videoWidth,
            this._desktopHeight - this._videoHeight, this._videoWidth, this._videoHeight);
        this._ctx.stroke();
    }

    /**
     * Starts loop to capture video frame and render presenter effect.
     *
     * @param {MediaStream} desktopStream - Stream to be used for processing.
     * @returns {MediaStream} - The stream with the applied effect.
     */
    startEffect(desktopStream) {
        const firstVideoTrack = desktopStream.getVideoTracks()[0];
        const { height, width }
            = firstVideoTrack.getSettings ? firstVideoTrack.getSettings()
                : firstVideoTrack.getConstraints();

        // set the desktop element properties
        this._desktopWidth = width;
        this._desktopHeight = height;
        this._desktopElement.width = width;
        this._desktopElement.height = height;
        this._desktopElement.autoplay = true;
        this._desktopElement.srcObject = desktopStream;

        this._canvas.width = width;
        this._canvas.height = height;

        this._videoFrameTimerWorker.postMessage({
            id: SET_INTERVAL,
            timeMs: 1000 / this._frameRate
        });

        return this._canvas.captureStream(this._frameRate);
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
