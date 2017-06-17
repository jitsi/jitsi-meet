import React, { Component } from 'react';

import tracking from 'tracking';

const ANOMALY_RECOGNIZED_DELAY = 6000;
const FACE_PROMPT_DURATION = 4000;

const FACE_TEXT_FONT_SIZE_RATIO = 0.3;

const TRACKING_INITIAL_SCALE = 4;
const TRACKING_STEP_SIZE = 2;
const TRACKING_EDGES_DENSITY = 0.1;

/**
 * React component for tracking face in a video, and displaying prompt if user's
 * face is not well-positioned for a while.
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
         * Whether or not face tracking needs to be enabled during the creation
         * of the component.
         */
        isFaceTrackingEnabled: React.PropTypes.bool,

        /**
         * Element selector for selecting target video element.
         */
        videoElementSelector: React.PropTypes.string
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
         * The internal reference to the topmost DOM/HTML element backing the
         * React {@code Component}. Used to contain warning message and
         * appropriate face rectangle area.
         *
         * @private
         * @type {HTMLDivElement}
         */
        this._rootElement = null;

        /**
         * The internal reference to the DOM/HTML element intended for showing
         * warning message.
         *
         * @private
         * @type {HTMLDivElement}
         */
        this._textElement = null;

        /**
         * The internal reference to the DOM/HTML element intended for showing
         * appropriate face position in a rectangle area.
         *
         * @private
         * @type {HTMLDivElement}
         */
        this._rectElement = null;

        /**
         * The internal reference to the DOM/HTML element for tracking.
         *
         * @private
         * @type {HTMLVideoElement|Object}
         */
        this._videoElement = null;

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
         * It has four attributes:
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

        // Bind event handlers so they are only bound once for every instance.
        this._setRootElement = this._setRootElement.bind(this);
        this._setTextElement = this._setTextElement.bind(this);
        this._setRectElement = this._setRectElement.bind(this);
    }

    /**
     * Invokes the library for tracking faces in the video.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this._videoElement
            = document.querySelector(this.props.videoElementSelector);

        if (this.props.isFaceTrackingEnabled) {
            if (this._videoElement.readyState === 4) {
                this._attachFaceTracking();
            } else {
                this._attachFaceTrackingWhenReady();
            }
        }
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
        this._initContainerSize();
        this._initFaceRect();
        this._initFontSize();
        this._trackFace();
    }

    /**
     * Registers handler to listen for 'canplay' event of target video. When
     * the event is fired, attaches face tracking mechanism to target video.
     * Only called when the target video is not ready.
     *
     * @private
     * @returns {void}
     */
    _attachFaceTrackingWhenReady() {
        const handler = e => {
            this._attachFaceTracking();
            this._videoElement.removeEventListener(e.type, handler);
        };

        this._videoElement.addEventListener('canplay', handler, false);
    }

    /**
     * Sets the width and height of target video element to the face prompt
     * container.
     *
     * @private
     * @returns {void}
     */
    _initContainerSize() {
        this._rootElement.setAttribute('style',
            `width:${this._videoElement.offsetWidth}px;
            height:${this._videoElement.offsetHeight}px`);
    }

    /**
     * Initializes rectangle of appropriate face position.
     *
     * @private
     * @returns {void}
     */
    _initFaceRect() {
        this._faceRect = {
            x: this._rectElement.offsetLeft - this._rootElement.offsetLeft,
            y: this._rectElement.offsetTop - this._rootElement.offsetTop,
            width: this._rectElement.offsetWidth,
            height: this._rectElement.offsetHeight
        };
    }

    /**
     * Initializes font size of warning messages, in precentage. Note that font
     * size cannot be larger than 100%.
     *
     * @private
     * @returns {void}
     */
    _initFontSize() {
        let size = this._rootElement.offsetWidth * FACE_TEXT_FONT_SIZE_RATIO;

        size = Math.min(size, 100);

        this._textElement.setAttribute('style', `font-size: ${size}%`);
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
            this.props.videoElementSelector, tracker, { camera: true });

        this._prevBadTime = new Date().getTime();
        tracker.on('track', event => {
            const currTime = new Date().getTime();

            if (this._isBadPosition(event.data)) {
                // A delay is set to make the face detection not very sensitive
                // to trivial disturbs.
                if (currTime - this._prevBadTime > ANOMALY_RECOGNIZED_DELAY) {
                    this._showPrompt();
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
     * Display warning message and appropriate face position rectangle for a
     * range of time.
     *
     * @private
     * @returns {void}
     */
    _showPrompt() {
        // If the prompt has been shown, just returns.
        if (this._isPromptShown()) {
            return;
        }

        this._textElement.className += ' show';
        this._rectElement.className += ' show';

        setTimeout(() => {
            this._textElement.classList.remove('show');
            this._rectElement.classList.remove('show');

            this._prevBadTime = new Date().getTime();
        }, FACE_PROMPT_DURATION);
    }

    /**
     * Whether or not the prompt information has been displayed.
     *
     * @returns {boolean}
     * @private
     */
    _isPromptShown() {
        return this._rectElement.classList.contains('show')
            && this._textElement.classList.contains('show');
    }

    /**
     * Sets an instance variable for the component's element intended for
     * displaying warning messages.
     *
     * @param {Object} element - DOM element intended for displaying warnings.
     * @private
     * @returns {void}
     */
    _setTextElement(element) {
        this._textElement = element;
    }

    /**
     * Sets the component's container element.
     *
     * @param {Object} element - The highest DOM element in the component.
     * @private
     * @returns {void}
     */
    _setRootElement(element) {
        this._rootElement = element;
    }

    /**
     * Sets an instance variable for the component's element intended for
     * displaying appropriate face position in a rectangle.
     *
     * @param {Object} element - DOM element intended for displaying appropriate
     * face position.
     * @private
     * @returns {void}
     */
    _setRectElement(element) {
        this._rectElement = element;
    }

    /**
     * Returns the view of FaceTracker component.
     *
     * @returns {ReactElement}
     * @private
     */
    _renderedView() {
        return (
            <div
                className = 'face-prompt-container'
                ref = { this._setRootElement }>
                <div
                    className = 'face-rect'
                    ref = { this._setRectElement } />
                <div
                    className = 'face-text'
                    ref = { this._setTextElement }>
                    Make sure to be in the center.
                </div>
            </div>
        );
    }
}

export default FaceTracker;
