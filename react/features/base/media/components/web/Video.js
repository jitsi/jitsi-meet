/* @flow */

import React, { Component } from 'react';

/**
 * The type of the React {@code Component} props of {@link Video}.
 */
type Props = {

    /**
     * CSS classes to add to the video element.
     */
    className: string,

    /**
     * The value of the id attribute of the video. Used by the torture tests to
     * locate video elements.
     */
    id: string,

    /**
     * Optional callback to invoke once the video starts playing.
     */
    onVideoPlaying?: Function,

    /**
     * The JitsiLocalTrack to display.
     */
    videoTrack: ?Object,

    /**
     * Used to determine the value of the autoplay attribute of the underlying
     * video element.
     */
    autoPlay: boolean
};

/**
 * Component that renders a video element for a passed in video track.
 *
 * @extends Component
 */
class Video extends Component<Props> {
    _videoElement: ?Object;

    /**
     * Default values for {@code Video} component's properties.
     *
     * @static
     */
    static defaultProps = {
        className: '',
        autoPlay: true,
        id: ''
    };

    /**
     * Initializes a new {@code Video} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        /**
         * The internal reference to the DOM/HTML element intended for
         * displaying a video.
         *
         * @private
         * @type {HTMLVideoElement}
         */
        this._videoElement = null;


        // Bind event handlers so they are only bound once for every instance.
        this._onVideoPlaying = this._onVideoPlaying.bind(this);
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
        if (this._videoElement) {
            this._videoElement.volume = 0;
            this._videoElement.onplaying = this._onVideoPlaying;
        }

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
     * element, as the lib uses {@code track.attach(videoElement)} instead.
     *
     * @inheritdoc
     * @returns {boolean} - False is always returned to blackbox this component
     * from React.
     */
    shouldComponentUpdate(nextProps: Props) {
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
        return (
            <video
                autoPlay = { this.props.autoPlay }
                className = { this.props.className }
                id = { this.props.id }
                ref = { this._setVideoElement } />
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

        videoTrack.jitsiTrack.attach(this._videoElement);
    }

    /**
     * Removes the association to the component's video element from the passed
     * in redux representation of jitsi video track to stop the track from
     * rendering.
     *
     * @param {Object} videoTrack -  The redux representation of the
     * {@code JitsiLocalTrack}.
     * @private
     * @returns {void}
     */
    _detachTrack(videoTrack) {
        if (this._videoElement && videoTrack && videoTrack.jitsiTrack) {
            videoTrack.jitsiTrack.detach(this._videoElement);
        }
    }

    _onVideoPlaying: () => void;

    /**
     * Invokes the onvideoplaying callback if defined.
     *
     * @private
     * @returns {void}
     */
    _onVideoPlaying() {
        if (this.props.onVideoPlaying) {
            this.props.onVideoPlaying();
        }
    }

    _setVideoElement: () => void;

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

export default Video;
