import React, { Component } from 'react';

import { translate } from '../../base/i18n';

const VIDEO_ERROR_CLASS = 'video-preview-has-error';

/**
 * React component for displaying video. This component defers to lib-jitsi-meet
 * logic for rendering the video.
 *
 * @extends Component
 */
class VideoInputPreview extends Component {
    /**
     * VideoInputPreview component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * An error message to display instead of a preview. Displaying an error
         * will take priority over displaying a video preview.
         */
        error: React.PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func,

        /**
         * The JitsiLocalTrack to display.
         */
        track: React.PropTypes.object
    };

    /**
     * Initializes a new VideoInputPreview instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        /**
         * The internal reference to the DOM/HTML element intended for showing
         * error messages.
         *
         * @private
         * @type {HTMLDivElement}
         */
        this._errorElement = null;

        /**
         * The internal reference to topmost DOM/HTML element backing the React
         * {@code Component}. Accessed directly for toggling a classname to
         * indicate an error is present so styling can be changed to display it.
         *
         * @private
         * @type {HTMLDivElement}
         */
        this._rootElement = null;

        /**
         * The internal reference to the DOM/HTML element intended for
         * displaying a video. This element may be an HTML video element or a
         * temasys video object.
         *
         * @private
         * @type {HTMLVideoElement|Object}
         */
        this._videoElement = null;

        // Bind event handlers so they are only bound once for every instance.
        this._setErrorElement = this._setErrorElement.bind(this);
        this._setRootElement = this._setRootElement.bind(this);
        this._setVideoElement = this._setVideoElement.bind(this);
    }

    /**
     * Invokes the library for rendering the video on initial display.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        if (this.props.error) {
            this._updateErrorView(this.props.error);
        } else {
            this._attachTrack(this.props.track);
        }
    }

    /**
     * Remove any existing associations between the current previewed track and
     * the component's video element.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        this._detachTrack(this.props.track);
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
                className = 'video-input-preview'
                ref = { this._setRootElement }>
                <video
                    autoPlay = { true }
                    className = 'video-input-preview-display flipVideoX'
                    ref = { this._setVideoElement } />
                <div
                    className = 'video-input-preview-error'
                    ref = { this._setErrorElement } />
            </div>
        );
    }

    /**
     * Only update when the deviceId has changed. This component is somewhat
     * black-boxed from React's rendering so lib-jitsi-meet can instead handle
     * updating of the video preview, which takes browser differences into
     * consideration. For example, temasys's video object must be visible to
     * update the displayed track, but React's re-rendering could potentially
     * remove the video object from the page.
     *
     * @inheritdoc
     * @returns {void}
     */
    shouldComponentUpdate(nextProps) {
        const hasNewTrack = nextProps.track !== this.props.track;

        if (hasNewTrack || nextProps.error) {
            this._detachTrack(this.props.track);
            this._updateErrorView(nextProps.error);
        }

        // Never attempt to show the new track if there is an error present.
        if (hasNewTrack && !nextProps.error) {
            this._attachTrack(nextProps.track);
        }

        return false;
    }

    /**
     * Calls into the passed in track to associate the track with the
     * component's video element and render video. Also sets the instance
     * variable for the video element as the element the track attached to,
     * which could be an Object if on a temasys supported browser.
     *
     * @param {JitsiLocalTrack} track - The library's track model which will be
     * displayed.
     * @private
     * @returns {void}
     */
    _attachTrack(track) {
        if (!track) {
            return;
        }

        const updatedVideoElement = track.attach(this._videoElement);

        this._setVideoElement(updatedVideoElement);
    }

    /**
     * Removes the association to the component's video element from the passed
     * in JitsiLocalTrack to stop the track from rendering. With temasys, the
     * video element must still be visible for detaching to complete.
     *
     * @param {JitsiLocalTrack} track - The library's track model which needs
     * to stop previewing in the video element.
     * @private
     * @returns {void}
     */
    _detachTrack(track) {
        // Detach the video element from the track only if it has already
        // been attached. This accounts for a special case with temasys
        // where if detach is being called before attach, the video
        // element is converted to Object without updating this
        // component's reference to the video element.
        if (this._videoElement
            && track
            && track.containers.includes(this._videoElement)) {
            track.detach(this._videoElement);
        }
    }

    /**
     * Sets an instance variable for the component's element intended for
     * displaying error messages. The element will be accessed directly to
     * display an error message.
     *
     * @param {Object} element - DOM element intended for displaying errors.
     * @private
     * @returns {void}
     */
    _setErrorElement(element) {
        this._errorElement = element;
    }

    /**
     * Sets the component's root element.
     *
     * @param {Object} element - The highest DOM element in the component.
     * @private
     * @returns {void}
     */
    _setRootElement(element) {
        this._rootElement = element;
    }

    /**
     * Sets an instance variable for the component's video element so it can be
     * referenced later for attaching and detaching a JitsiLocalTrack.
     *
     * @param {Object} element - DOM element for the component's video display.
     * @private
     * @returns {void}
     */
    _setVideoElement(element) {
        this._videoElement = element;
    }

    /**
     * Adds or removes a class to the component's parent node to indicate an
     * error has occurred. Also sets the error text.
     *
     * @param {string} error - The error message to display. If falsy, error
     * message display will be hidden.
     * @private
     * @returns {void}
     */
    _updateErrorView(error) {
        if (error) {
            this._rootElement.classList.add(VIDEO_ERROR_CLASS);
        } else {
            this._rootElement.classList.remove(VIDEO_ERROR_CLASS);
        }

        this._errorElement.innerText = error || '';
    }
}

export default translate(VideoInputPreview);
