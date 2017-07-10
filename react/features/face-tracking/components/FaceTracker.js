import tracking from 'jstracking';

const FACE_RECT_WIDTH_RATIO = 0.7;
const FACE_RECT_HEIGHT_RATIO = 0.9;
const FACE_RECT_TOP_RATIO = (1 - FACE_RECT_HEIGHT_RATIO) / 2;
const FACE_RECT_LEFT_RATIO = (1 - FACE_RECT_WIDTH_RATIO) / 2;

const TRACKING_INITIAL_SCALE = 4;
const TRACKING_STEP_SIZE = 2;
const TRACKING_EDGES_DENSITY = 0.1;

/**
 * Class for tracking faces in a video.
 */
class FaceTracker {

    /**
     * Initializes a new FaceTracker instance.
     *
     * @param  {Object} props - The read-only props with the new instance is
     * to be initialized.
     */
    constructor(props) {
        const { videoElement, ...options } = props;

        /**
         * Options for tracking, and may contain tracking delay, tracking fps,
         * and warning duration.
         *
         * @type {Object}
         */
        this._options = options;

        /**
         * The internal reference to the DOM/HTML video element to track face.
         *
         * @type {HTMLVideoElement|Object}
         */
        this._videoElement = videoElement;

        /**
         * Previous time when the user's face is not well-positioned.
         *
         * @private
         * @type {Date}
         */
        this._prevBadTime = null;

        /**
         * An object which represents the rectangle area, considered as the good
         * position for a user's face recognized.
         * It has four properties:
         *     x - x coordinate of top left point based on the video.
         *     y - y coordinate of top left point based on the video.
         *     width - width of the good rectangle area.
         *     height - height of the good rectangle area.
         *
         * NOTE: Assigned in {@link FaceTracker#_initFaceRect()}
         * @private
         * @type {Object}
         */
        this._faceRect = null;

        /**
         * Whether or not the face tracking mechanism is enabled.
         *
         * @private
         * @type {boolean}
         */
        this._enabled = false;

        /**
         * A ObjectTracker instance for face tracking.
         *
         * @type {Object}
         */
        this._tracker = null;

        /**
         * A TrackerTask instance to run the face tracking computation.
         * It is created via a Tracker instance.
         *
         * @type {Object}
         */
        this._trackerTask = null;

        /**
         * Whether an anomaly (the user's face is not well-positioned for a
         * while) is detected or not.
         * If true, necessary warning infomration needs to be toggled.
         *
         * @type {Boolean}
         */
        this._isAnomalyDetected = false;
    }

    /**
     * Attach face tracking mechanism to target video.
     *
     * @param {callback} showWarningCb - Callback to show warning
     * information when anomaly is recognized.
     * @param {callback} hideWarningCb - Callback to dismiss warning
     * information.
     * @returns {void}
     */
    attachFaceTracking(showWarningCb, hideWarningCb) {
        if (this._enabled) {
            return;
        }
        this._enabled = true;
        this._initFaceRect();
        this._initTracker();
        this._trackFace(showWarningCb, hideWarningCb);
    }

    /**
     * Detach face tracking mechanism from target video.
     *
     * @returns {void}
     */
    detachFaceTracking() {
        if (!this._enabled) {
            return;
        }
        this._enabled = false;
        this._detrackFace();
    }

    /**
     * Initializes tracking instance and parameters.
     *
     * @returns {void}
     */
    _initTracker() {
        this._tracker = new tracking.ObjectTracker('face');

        // Sets necessary face tracking parameters.
        this._tracker.setInitialScale(TRACKING_INITIAL_SCALE);
        this._tracker.setStepSize(TRACKING_STEP_SIZE);
        this._tracker.setEdgesDensity(TRACKING_EDGES_DENSITY);
    }

    /**
     * Initializes rectangle of appropriate face position.
     *
     * @private
     * @returns {void}
     */
    _initFaceRect() {
        const videoElement = this._videoElement;

        console.warn('offsetWidth', videoElement.offsetWidth);
        this._faceRect = {
            x: videoElement.offsetWidth * FACE_RECT_LEFT_RATIO,
            y: videoElement.offsetHeight * FACE_RECT_TOP_RATIO,
            width: videoElement.offsetWidth * FACE_RECT_WIDTH_RATIO,
            height: videoElement.offsetHeight * FACE_RECT_HEIGHT_RATIO
        };
    }

    /**
     * Calls tracking.js library to recognize faces in the video.
     *
     * @param {callback} showWarningCb - Callback to show warning
     * information when anomaly is recognized.
     * @param {callback} hideWarningCb - Callback to dismiss warning
     * information.
     * @private
     * @returns {void}
     */
    _trackFace(showWarningCb, hideWarningCb) {
        this._trackerTask = tracking.track(
            this._videoElement, this._tracker, {
                fps: this._options.fps,
                scaled: true
            }
        );

        this._prevBadTime = new Date().getTime();
        this._tracker.on('track', event => {
            const currTime = new Date().getTime();

            if (this._isBadPosition(event.data)) {
                if (this._isAnomalyDetected) {
                    clearTimeout(this._timeoutId);
                    this._setWarningTimeout(hideWarningCb);
                    this._prevBadTime = currTime;
                } else if (currTime - this._prevBadTime > this._options.delay) {
                    // A delay is set to make the face detection not very
                    // sensitive to trivial disturbs.
                    this._toggleWarning(showWarningCb, hideWarningCb);
                    this._prevBadTime = currTime;
                }
            } else {
                // Once a good face position is detected, resets previous
                // bad time.
                this._prevBadTime = currTime;
            }
        });
    }

    /**
     * Disable face tracking in the video.
     *
     * @private
     * @returns {void}
     */
    _detrackFace() {
        this._trackerTask.stop();
        this._tracker.removeAllListeners();
    }

    /**
     * Checks whether or not the recognized face is at good position, namely,
     * in the scope of appropriate rectangle area.
     *
     * @param {Object} faceData - Object representing face recognized.
     * @private
     * @returns {boolean}
     */
    _isBadPosition(faceData) {
        console.warn('faceData', faceData);
        if (faceData.length < 1) {
            return true;
        }

        for (const rect of faceData) {
            console.warn(this._faceRect.x, this._faceRect.y,
              this._faceRect.width, this._faceRect.height);
            console.warn(rect.x, rect.y, rect.width, rect.height);

            if (rect.x > this._faceRect.x
                && rect.y > this._faceRect.y
                && rect.x + rect.width
                    < this._faceRect.x + this._faceRect.width
                && rect.y + rect.height
                    < this._faceRect.y + this._faceRect.height) {
                return false;
            }
        }

        return true;
    }

    /**
     * Displays necessary warning information.
     *
     * @param {callback} showWarningCb - Callback to show warning
     * information when anomaly is recognized.
     * @param {callback} hideWarningCb - Callback to dismiss warning
     * information.
     * @private
     * @returns {void}
     */
    _toggleWarning(showWarningCb, hideWarningCb) {
        console.warn('togglewarning...');
        console.warn(showWarningCb);
        if (this._isAnomalyDetected) {
            return;
        }

        showWarningCb();
        this._isAnomalyDetected = true;

        this._setWarningTimeout(hideWarningCb);
    }

    /**
     * Set the timeout for the warning information. When time out, warnings
     * will be dismissed.
     *
     * @param {callback} hideWarningCb - Callback to dismiss warning
     * information.
     * @private
     * @returns {void}
     */
    _setWarningTimeout(hideWarningCb) {
        this._timeoutId = setTimeout(() => {
            hideWarningCb();
            this._isAnomalyDetected = false;
            this._prevBadTime = new Date().getTime();
        }, this._options.duration);
    }
}

export default FaceTracker;
