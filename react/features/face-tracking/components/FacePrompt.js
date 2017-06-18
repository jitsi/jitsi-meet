import React, { Component } from 'react';

const FACE_TEXT_FONT_SIZE_RATIO = 0.3;

/**
 * React component for displaying warning message and appropriate face area on
 * a video.
 *
 * @extends Component
 */
class FacePrompt extends Component {
    /**
     * FacePrompt component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Reference to a HTML video element for displaying prompt on.
         */
        videoElement: React.PropTypes.object
    };

    /**
     * Initializes a new FacePrompt instance.
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
         * The internal reference to the DOM/HTML element to display face prompt
         * on.
         *
         * @private
         * @type {HTMLVideoElement|Object}
         */
        this._videoElement = this.props.videoElement;

        // Bind event handlers so they are only bound once for every instance.
        this._setRootElement = this._setRootElement.bind(this);
        this._setTextElement = this._setTextElement.bind(this);
        this._setRectElement = this._setRectElement.bind(this);
    }

    /**
     * Invokes the library for rendering face prompt.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this._initContainerSize();
        this._initFontSize();
        this._show();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
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

    /**
     * Shows warning message and appropriate face position rectangle.
     *
     * @private
     * @returns {void}
     */
    _show() {
        this._textElement.className += ' show';
        this._rectElement.className += ' show';
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
     * Initializes font size of warning messages, in percentage. Note that font
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
}

export default FacePrompt;
