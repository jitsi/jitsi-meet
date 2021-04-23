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
    autoPlay: boolean,

    /**
     * Used to determine the value of the autoplay attribute of the underlying
     * video element.
     */
    playsinline: boolean,

    /**
     * A map of the event handlers for the video HTML element.
     */
    eventHandlers?: {|

        /**
         * onAbort event handler.
         */
        onAbort?: ?Function,

        /**
         * onCanPlay event handler.
         */
        onCanPlay?: ?Function,

        /**
         * onCanPlayThrough event handler.
         */
        onCanPlayThrough?: ?Function,

        /**
         * onEmptied event handler.
         */
        onEmptied?: ?Function,

        /**
         * onEnded event handler.
         */
        onEnded?: ?Function,

        /**
         * onError event handler.
         */
        onError?: ?Function,

        /**
         * onLoadedData event handler.
         */
        onLoadedData?: ?Function,

        /**
         * onLoadedMetadata event handler.
         */
        onLoadedMetadata?: ?Function,

        /**
         * onLoadStart event handler.
         */
        onLoadStart?: ?Function,

        /**
         * onPause event handler.
         */
        onPause?: ?Function,

        /**
         * onPlay event handler.
         */
        onPlay?: ?Function,

        /**
         * onPlaying event handler.
         */
        onPlaying?: ?Function,

        /**
         * onRateChange event handler.
         */
        onRateChange?: ?Function,

        /**
         * onStalled event handler.
         */
        onStalled?: ?Function,

        /**
         * onSuspend event handler.
         */
        onSuspend?: ?Function,

        /**
         * onWaiting event handler.
         */
        onWaiting?: ?Function
    |},

    /**
     * A styles that will be applied on the video element.
     */
    style?: Object,

    /**
     * The value of the muted attribute for the underlying video element.
     */
    muted?: boolean
};

/**
 * Component that renders a video element for a passed in video track.
 *
 * @extends Component
 */
class Video extends Component<Props> {
    _videoElement: ?Object;
    _mounted: boolean;

    /**
     * Default values for {@code Video} component's properties.
     *
     * @static
     */
    static defaultProps = {
        className: '',
        autoPlay: true,
        id: '',
        playsinline: true
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
        this._mounted = true;

        if (this._videoElement) {
            this._videoElement.volume = 0;
            this._videoElement.onplaying = this._onVideoPlaying;
        }

        this._attachTrack(this.props.videoTrack);

        if (this._videoElement && this.props.autoPlay) {
            // Ensure the video gets play() called on it. This may be necessary in the
            // case where the local video container was moved and re-attached, in which
            // case video does not autoplay.
            this._videoElement.play()
                .catch(error => {
                    // Prevent uncaught "DOMException: The play() request was interrupted by a new load request"
                    // when video playback takes long to start and it starts after the component was unmounted.
                    if (this._mounted) {
                        throw error;
                    }
                });
        }
    }

    /**
     * Remove any existing associations between the current video track and the
     * component's video element.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        this._mounted = false;
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

        if (this.props.style !== nextProps.style || this.props.className !== nextProps.className) {
            return true;
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
        const {
            autoPlay,
            className,
            id,
            muted,
            playsinline,
            style,
            eventHandlers
        } = this.props;

        return (
            <video
                autoPlay = { autoPlay }
                className = { className }
                id = { id }
                muted = { muted }
                playsInline = { playsinline }
                ref = { this._setVideoElement }
                style = { style }
                { ...eventHandlers } />
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
