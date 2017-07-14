import React from 'react';
import { connect } from 'react-redux';

import AbstractVideoTrack from '../AbstractVideoTrack';

/**
 * Component that renders a video element for a passed in video track.
 *
 * @extends AbstractVideoTrack
 */
class VideoTrack extends AbstractVideoTrack {
    /**
     * Default values for {@code VideoTrack} component's properties.
     *
     * @static
     */
    static defaultProps = {
        ...AbstractVideoTrack.defaultProps,

        className: '',

        id: ''
    };

    /**
     * {@code VideoTrack} component's property types.
     *
     * @static
     */
    static propTypes = {
        ...AbstractVideoTrack.propTypes,

        /**
         * CSS classes to add to the video element.
         */
        className: React.PropTypes.string,

        /**
         * The value of the id attribute of the video. Used by the torture tests
         * to locate video elements.
         */
        id: React.PropTypes.string
    };

    /**
     * Initializes a new VideoTrack instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

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
        this._setVideoElement = this._setVideoElement.bind(this);
    }

    /**
     * Invokes the library for rendering the video on initial display. Sets the
     * volume level to zero to ensure no sound plays.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        // Add these attributes directly onto the video element so temasys can
        // use them when converting the video to an object.
        this._videoElement.volume = 0;
        this._videoElement.onplaying = this._onVideoPlaying;

        this._attachTrack(this.props.videoTrack);
    }

    /**
     * Remove any existing associations between the current video track and the
     * component's video element.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        this._detachTrack(this.props.videoTrack);
    }

    /**
     * Updates the video display only if a new track is added. This component's
     * updating is blackboxed from React to prevent re-rendering of video
     * element, as the lib uses track.attach(videoElement) instead. Also,
     * re-rendering cannot be used with temasys, which replaces video elements
     * with an object.
     *
     * @inheritdoc
     * @returns {boolean} - False is always returned to blackbox this component.
     * from React.
     */
    shouldComponentUpdate(nextProps) {
        const currentJitsiTrack = this.props.videoTrack
            && this.props.videoTrack.jitsiTrack;
        const nextJitsiTrack = nextProps.videoTrack
            && nextProps.videoTrack.jitsiTrack;

        if (currentJitsiTrack !== nextJitsiTrack) {
            this._detachTrack(this.props.videoTrack);
            this._attachTrack(nextProps.videoTrack);
        }

        return false;
    }

    /**
     * Renders the video element.
     *
     * @override
     * @returns {ReactElement}
     */
    render() {
        // The wrapping div is necessary because temasys will replace the video
        // with an object but react will keep expecting the video element. The
        // div gives a constant element for react to keep track of.
        return (
            <div>
                <video
                    autoPlay = { true }
                    className = { this.props.className }
                    id = { this.props.id }
                    ref = { this._setVideoElement } />
            </div>
        );
    }

    /**
     * Calls into the passed in track to associate the track with the
     * component's video element and render video.
     *
     * @param {Object} videoTrack - The redux representation of the
     * {@code JitsiLocalTrack}.
     * @private
     * @returns {void}
     */
    _attachTrack(videoTrack) {
        if (!videoTrack || !videoTrack.jitsiTrack) {
            return;
        }

        const updatedVideoElement
            = videoTrack.jitsiTrack.attach(this._videoElement);

        // Sets the instance variable for the video element again as the element
        // maybe have been replaced with a new object by temasys.
        this._setVideoElement(updatedVideoElement);
    }

    /**
     * Removes the association to the component's video element from the passed
     * in redux representation of jitsi video track to stop the track from
     * rendering. With temasys, the video element must still be visible for
     * detaching to complete.
     *
     * @param {Object} videoTrack -  The redux representation of the
     * {@code JitsiLocalTrack}.
     * @private
     * @returns {void}
     */
    _detachTrack(videoTrack) {
        // Detach the video element from the track only if it has already
        // been attached. This accounts for a special case with temasys
        // where if detach is being called before attach, the video
        // element is converted to Object without updating this
        // component's reference to the video element.
        if (this._videoElement
            && videoTrack
            && videoTrack.jitsiTrack
            && videoTrack.jitsiTrack.containers.includes(this._videoElement)) {
            videoTrack.jitsiTrack.detach(this._videoElement);
        }
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
}

export default connect()(VideoTrack);
