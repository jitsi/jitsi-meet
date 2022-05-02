// @flow

import React, { Component } from 'react';

import { connect } from '../../base/redux';
import { shouldDisplayTileView } from '../../video-layout';

/**
 * Constants to describe the dimensions of the video. Landscape videos
 * are wider than they are taller and portrait videos are taller than they
 * are wider. The dimensions will determine how {@code LargeVideoBackground}
 * will stretch to fill its container.
 *
 * @type {Object}
 */
export const ORIENTATION = {
    LANDSCAPE: 'landscape',
    PORTRAIT: 'portrait'
};

/**
 * The type of the React {@code Component} props of
 * {@link LargeVideoBackgroundCanvas}.
 */
type Props = {

   /**
     * Whether or not the layout should change to support tile view mode.
     *
     * @protected
     * @type {boolean}
     */
    _shouldDisplayTileView: boolean,

    /**
     * Additional CSS class names to add to the root of the component.
     */
    className: String,

    /**
     * Whether or not the background should have its visibility hidden.
     */
    hidden: boolean,

    /**
     * Whether or not the video should display flipped horizontally, so left
     * becomes right and right becomes left.
     */
    mirror: boolean,

    /**
     * Whether the component should ensure full width of the video is displayed
     * (landscape) or full height (portrait).
     */
    orientationFit: string,

    /**
     * The video stream to display.
     */
    videoElement: Object
};


/**
 * Implements a React Component which shows a video element intended to be used
 * as a background to fill the empty space of container with another video.
 *
 * @augments Component
 */
export class LargeVideoBackground extends Component<Props> {
    _canvasEl: Object;

    _updateCanvasInterval: *;

    /**
     * Initializes new {@code LargeVideoBackground} instance.
     *
     * @param {*} props - The read-only properties with which the new instance
     * is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._setCanvasEl = this._setCanvasEl.bind(this);
        this._updateCanvas = this._updateCanvas.bind(this);
    }

    /**
     * If the canvas is not hidden, sets the initial interval to update the
     * image displayed in the canvas.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        const { _shouldDisplayTileView, hidden, videoElement } = this.props;

        if (videoElement && !hidden && !_shouldDisplayTileView) {
            this._updateCanvas();
            this._setUpdateCanvasInterval();
        }
    }

    /**
     * Starts or stops the interval to update the image displayed in the canvas.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: Props) {
        const wasCanvasUpdating = !prevProps.hidden && !prevProps._shouldDisplayTileView && prevProps.videoElement;
        const shouldCanvasUpdating
            = !this.props.hidden && !this.props._shouldDisplayTileView && this.props.videoElement;

        if (wasCanvasUpdating !== shouldCanvasUpdating) {
            if (shouldCanvasUpdating) {
                this._clearCanvas();
                this._setUpdateCanvasInterval();
            } else {
                this._clearCanvas();
                this._clearUpdateCanvasInterval();
            }
        }
    }

    /**
     * Clears the interval for updating the image displayed in the canvas.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._clearUpdateCanvasInterval();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            hidden,
            mirror
        } = this.props;
        const classNames = `large-video-background ${mirror ? 'flip-x' : ''} ${hidden ? 'invisible' : ''}`;

        return (
            <div className = { classNames }>
                <canvas
                    id = 'largeVideoBackground'
                    ref = { this._setCanvasEl } />
            </div>
        );
    }

    /**
     * Removes any image displayed on the canvas.
     *
     * @private
     * @returns {void}
     */
    _clearCanvas() {
        const cavnasContext = this._canvasEl.getContext('2d');

        cavnasContext.clearRect(
            0, 0, this._canvasEl.width, this._canvasEl.height);
    }

    /**
     * Clears the interval for updating the image displayed in the canvas.
     *
     * @private
     * @returns {void}
     */
    _clearUpdateCanvasInterval() {
        clearInterval(this._updateCanvasInterval);
    }

    _setCanvasEl: () => void;

    /**
     * Sets the instance variable for the component's canvas element so it can
     * be accessed directly for drawing on.
     *
     * @param {Object} element - The DOM element for the component's canvas.
     * @private
     * @returns {void}
     */
    _setCanvasEl(element) {
        this._canvasEl = element;
    }

    /**
     * Starts the interval for updating the image displayed in the canvas.
     *
     * @private
     * @returns {void}
     */
    _setUpdateCanvasInterval() {
        this._clearUpdateCanvasInterval();
        this._updateCanvasInterval = setInterval(this._updateCanvas, 200);
    }

    _updateCanvas: () => void;

    /**
     * Draws the current frame of the passed in video element onto the canvas.
     *
     * @private
     * @returns {void}
     */
    _updateCanvas() {
        // On Electron 7 there is a memory leak if we try to draw into a hidden canvas that is part of the DOM tree.
        // See: https://github.com/electron/electron/issues/22417
        // Trying to detect all the cases when the page will be hidden because of something not in our control
        // (for example when the page is loaded in an iframe which is hidden due to the host page styles) to solve
        // the memory leak. Currently we are not handling the use case when the page is hidden with visibility:hidden
        // because we don't have a good way to do it.
        // All other cases when the canvas is not visible are handled through the component props
        // (hidden, _shouldDisplayTileView).
        if (!this._canvasEl || this._canvasEl.offsetParent === null
                || window.innerHeight === 0 || window.innerWidth === 0) {
            return;
        }

        const { videoElement } = this.props;
        const { videoWidth, videoHeight } = videoElement;
        const {
            height: canvasHeight,
            width: canvasWidth
        } = this._canvasEl;
        const cavnasContext = this._canvasEl.getContext('2d');

        if (this.props.orientationFit === ORIENTATION.LANDSCAPE) {
            const heightScaledToFit = (canvasWidth / videoWidth) * videoHeight;

            cavnasContext.drawImage(
                videoElement, 0, 0, canvasWidth, heightScaledToFit);
        } else {
            const widthScaledToFit = (canvasHeight / videoHeight) * videoWidth;

            cavnasContext.drawImage(
                videoElement, 0, 0, widthScaledToFit, canvasHeight);
        }
    }
}

/**
 * Maps (parts of) the Redux state to the associated LargeVideoBackground props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _shouldDisplayTileView: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        _shouldDisplayTileView: shouldDisplayTileView(state)
    };
}


export default connect(_mapStateToProps)(LargeVideoBackground);

