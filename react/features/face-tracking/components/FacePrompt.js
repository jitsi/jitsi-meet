import React, { Component } from 'react';
import { connect } from 'react-redux';

import { SHOW_PROMPT } from '../actionTypes';

const FACE_TEXT_FONT_SIZE_RATIO = 0.3;
const FACE_MAX_TEXT_FONT_SIZE = 150;
const PROMPT_SHOW_CLASS = 'show';

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
         * Shows face prompt or hides the prompt.
         */
        actionType: React.PropTypes.symbol,

        /**
         * Reference to a HTML video element whose face prompt needs
         * to be toggled.
         */
        toggledVideoElement: React.PropTypes.object,

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
        setTimeout(() => {
            this._initContainerSize();
            this._initFontSize();
        }, 1000);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        console.warn(this.props);
        if (this._videoElement
            && this._videoElement === this.props.toggledVideoElement) {
            if (this.props.actionType === SHOW_PROMPT) {
                this._show();
            } else {
                this._hide();
            }
        }

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
        this._textElement.classList.add(PROMPT_SHOW_CLASS);
        this._rectElement.classList.add(PROMPT_SHOW_CLASS);
    }

    /**
     * Hides warning message and appropriate face position rectangle.
     *
     * @private
     * @returns {void}
     */
    _hide() {
        this._textElement.classList.remove(PROMPT_SHOW_CLASS);
        this._rectElement.classList.remove(PROMPT_SHOW_CLASS);
    }

    /**
     * Sets the width and height of target video element to the face prompt
     * container.
     *
     * @private
     * @returns {void}
     */
    _initContainerSize() {
        console.warn('rootElement', this._rootElement);
        this._rootElement.setAttribute('style',
            `width:${this._videoElement.offsetWidth}px;
            height:${this._videoElement.offsetHeight}px`);
    }

    /**
     * Initializes font size of warning messages, in percentage. Note that font
     * size cannot be larger than FACE_MAX_TEXT_FONT_SIZE.
     *
     * @private
     * @returns {void}
     */
    _initFontSize() {
        let size = this._rootElement.offsetWidth * FACE_TEXT_FONT_SIZE_RATIO;

        size = Math.min(size, FACE_MAX_TEXT_FONT_SIZE);

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

/**
 * Maps (parts of) the Redux state to the associated
 * {@code FacePrompt}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     actionType: React.PropTypes.object,
 *     toggledVideoElement: React.PropTypes.object
 * }}
 */
function _mapStateToProps(state) {
    return {
        actionType: state['features/face-tracking'].type,
        toggledVideoElement: state['features/face-tracking'].videoElement
    };
}

export default connect(_mapStateToProps)(FacePrompt);
