import React, { Component } from 'react';
import { connect } from 'react-redux';
import tracking from 'tracking';

import FacePrompt from './FacePrompt';

const ANOMALY_RECOGNIZED_DELAY = 6000;
const FACE_PROMPT_DURATION = 4000;

const FACE_RECT_WIDTH_RATIO = 0.7;
const FACE_RECT_HEIGHT_RATIO = 0.9;
const FACE_RECT_TOP_RATIO = (1 - FACE_RECT_HEIGHT_RATIO) / 2;
const FACE_RECT_LEFT_RATIO = (1 - FACE_RECT_WIDTH_RATIO) / 2;

const TRACKING_INITIAL_SCALE = 4;
const TRACKING_STEP_SIZE = 2;
const TRACKING_EDGES_DENSITY = 0.1;

/**
 * React component for tracking face in a video, and calling FacePrompt
 * component to display prompt if user's face is not well-positioned for a
 * while.
 *
 * @extends Component
 */
class FaceTracker extends Component {
    /**
     * FaceTracker component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Reference to a HTML video element for face tracking.
         */
        videoElement: React.PropTypes.object
    };

    /**
     * Initializes a new FaceTracker instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

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
         * It has four key/value pairs:
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

        this.state = {
            /**
             * Whether or not the face prompt is toggled.
             *
             * @type {boolean}
             */
            isPromptToggled: false
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return this._renderedView();
    }

    /**
     * Initializes necessary variables, and attaches face tracking mechanism
     * to target video.
     *
     * @private
     * @returns {void}
     */
    _attachFaceTracking() {
        this._initFaceRect();
        this._trackFace();
    }

    /**
     * Initializes rectangle of appropriate face position.
     *
     * @private
     * @returns {void}
     */
    _initFaceRect() {
        const videoElement = this.props.videoElement;

        this._faceRect = {
            x: videoElement.offsetWidth * FACE_RECT_LEFT_RATIO,
            y: videoElement.offsetHeight * FACE_RECT_TOP_RATIO,
            width: videoElement.offsetWidth * FACE_RECT_WIDTH_RATIO,
            height: videoElement.offsetHeight * FACE_RECT_HEIGHT_RATIO
        };
    }

    /**
     * Calls tracking.js library to recognize faces shown in the video. When the
     * face is not well-positioned for a while, toggles necessary prompts on the
     * video.
     *
     * @private
     * @returns {void}
     */
    _trackFace() {
        const tracker = new tracking.ObjectTracker('face');

        // Sets necessary face tracking parameters.
        tracker.setInitialScale(TRACKING_INITIAL_SCALE);
        tracker.setStepSize(TRACKING_STEP_SIZE);
        tracker.setEdgesDensity(TRACKING_EDGES_DENSITY);

        tracking.track(
            this.props.videoElement, tracker, { camera: true });

        this._prevBadTime = new Date().getTime();
        tracker.on('track', event => {
            const currTime = new Date().getTime();

            if (this._isBadPosition(event.data)) {
                // A delay is set to make the face detection not very sensitive
                // to trivial disturbs.
                if (currTime - this._prevBadTime > ANOMALY_RECOGNIZED_DELAY) {
                    this._togglePrompt();
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
     * Checks whether or not the recognized face is at good position, namely,
     * in the scope of appropriate rectangle area.
     *
     * @param {Object} faceData - Object representing face recognized.
     * @private
     * @returns {boolean}
     */
    _isBadPosition(faceData) {
        if (faceData.length < 1) {
            return true;
        }

        for (const rect of faceData) {
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
     * Displays warning message and appropriate face position rectangle for a
     * range of time.
     *
     * @private
     * @returns {void}
     */
    _togglePrompt() {
        // If the prompt has been shown, just returns.
        if (this.state.isPromptToggled) {
            return;
        }

        this.setState({ isPromptToggled: true });

        this._setPromptTimeout();
    }

    /**
     * Sets the timeout to dismiss the face prompt.
     *
     * @private
     * @returns {void}
     */
    _setPromptTimeout() {
        setTimeout(() => {
            this.setState({ isPromptToggled: false });

            this._prevBadTime = new Date().getTime();
        }, FACE_PROMPT_DURATION);
    }

    /**
     * Returns the view of FaceTracker component.
     *
     * @returns {ReactElement}
     * @private
     */
    _renderedView() {
        if (this.props.videoElement) {
            if (!this._enabled) {
                this._enabled = true;
                this._attachFaceTracking();
            }

            return (
                <div>
                    { this.state.isPromptToggled
                      && <FacePrompt
                          videoElement = { this.props.videoElement } /> }
                </div>
            );
        }

        return <div />;
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code FaceTracker}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     videoElement: React.PropTypes.object
 * }}
 */
function _mapStateToProps(state) {
    return {
        videoElement: state['features/face-tracking'].videoElement
    };
}

export default connect(_mapStateToProps)(FaceTracker);
