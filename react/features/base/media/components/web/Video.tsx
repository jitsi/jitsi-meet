import React, { Component, ReactEventHandler } from 'react';

import { ITrack } from '../../../tracks/types';
import logger from '../../logger';

/**
 * The type of the React {@code Component} props of {@link Video}.
 */
interface IProps {

    /**
     * Used to determine the value of the autoplay attribute of the underlying
     * video element.
     */
    autoPlay: boolean;

    /**
     * CSS classes to add to the video element.
     */
    className: string;

    /**
     * A map of the event handlers for the video HTML element.
     */
    eventHandlers?: {

        /**
         * OnAbort event handler.
         */
        onAbort?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnCanPlay event handler.
         */
        onCanPlay?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnCanPlayThrough event handler.
         */
        onCanPlayThrough?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnEmptied event handler.
         */
        onEmptied?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnEnded event handler.
         */
        onEnded?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnError event handler.
         */
        onError?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnLoadStart event handler.
         */
        onLoadStart?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnLoadedData event handler.
         */
        onLoadedData?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnLoadedMetadata event handler.
         */
        onLoadedMetadata?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnPause event handler.
         */
        onPause?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnPlay event handler.
         */
        onPlay?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnPlaying event handler.
         */
        onPlaying?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnRateChange event handler.
         */
        onRateChange?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnStalled event handler.
         */
        onStalled?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnSuspend event handler.
         */
        onSuspend?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnWaiting event handler.
         */
        onWaiting?: ReactEventHandler<HTMLVideoElement>;
    };

    /**
     * The value of the id attribute of the video. Used by the torture tests to
     * locate video elements.
     */
    id: string;

    /**
     * Used on native.
     */
    mirror?: boolean;

    /**
     * The value of the muted attribute for the underlying video element.
     */
    muted?: boolean;

    /**
     * Used on native.
     */
    onPlaying?: Function;

    /**
     * Used on native.
     */
    onPress?: Function;

    /**
     * Optional callback to invoke once the video starts playing.
     */
    onVideoPlaying?: Function;

    /**
     * Used to determine the value of the autoplay attribute of the underlying
     * video element.
     */
    playsinline: boolean;

    /**
     * Used on native.
     */
    stream?: any;

    /**
     * A styles that will be applied on the video element.
     */
    style?: Object;

    /**
     * The JitsiLocalTrack to display.
     */
    videoTrack?: Partial<ITrack>;

    /**
     * Used on native.
     */
    zOrder?: number;

    /**
     * Used on native.
     */
    zoomEnabled?: boolean;
}

/**
 * Component that renders a video element for a passed in video track.
 *
 * @augments Component
 */
class Video extends Component<IProps> {
    _videoElement?: HTMLVideoElement | null;
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
    constructor(props: IProps) {
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
    override componentDidMount() {
        this._mounted = true;

        if (this._videoElement) {
            this._videoElement.volume = 0;
            this._videoElement.onplaying = this._onVideoPlaying;
        }

        this._attachTrack(this.props.videoTrack).finally(() => {
            if (this._videoElement && this.props.autoPlay) {
                // Ensure the video gets play() called on it. This may be necessary in the
                // case where the local video container was moved and re-attached, in which
                // case video does not autoplay.

                this._videoElement.play()
                .catch(error => {
                    // Prevent uncaught "DOMException: The play() request was interrupted by a new load request"
                    // when video playback takes long to start and it starts after the component was unmounted.
                    if (this._mounted) {
                        logger.error(`Error while trying to play video with id ${
                            this.props.id} and video track ${this.props.videoTrack?.jitsiTrack}: ${error}`);
                    }
                });
            }
        });
    }

    /**
     * Remove any existing associations between the current video track and the
     * component's video element.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentWillUnmount() {
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
    override shouldComponentUpdate(nextProps: IProps) {
        const currentJitsiTrack = this.props.videoTrack?.jitsiTrack;
        const nextJitsiTrack = nextProps.videoTrack?.jitsiTrack;

        if (currentJitsiTrack !== nextJitsiTrack) {
            this._detachTrack(this.props.videoTrack);
            this._attachTrack(nextProps.videoTrack).catch((_error: Error) => {
                // Ignore the error. We are already logging it.
            });

            // NOTE: We may want to consider calling .play() explicitly in this case if any issues araise in future.
            // For now it seems we are good with the autoplay attribute of the video element.
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
    override render() {
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
    _attachTrack(videoTrack?: Partial<ITrack>) {
        const { id } = this.props;

        if (!videoTrack?.jitsiTrack) {
            logger.warn(`Attach is called on video element ${id} without tracks passed!`);

            // returning Promise.resolve just keep the previous logic.
            // TODO: Check if it make sense to call play on this element or we can just return promise.reject().
            return Promise.resolve();
        }

        return videoTrack.jitsiTrack.attach(this._videoElement)
            .catch((error: Error) => {
                logger.error(
                    `Attaching the remote track ${videoTrack.jitsiTrack} to video with id ${id} has failed with `,
                    error);
            });
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
    _detachTrack(videoTrack?: Partial<ITrack>) {
        if (this._videoElement && videoTrack?.jitsiTrack) {
            videoTrack.jitsiTrack.detach(this._videoElement);
        }
    }

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

    /**
     * Sets an instance variable for the component's video element so it can be
     * referenced later for attaching and detaching a JitsiLocalTrack.
     *
     * @param {Object} element - DOM element for the component's video display.
     * @private
     * @returns {void}
     */
    _setVideoElement(element: HTMLVideoElement | null) {
        this._videoElement = element;
    }
}

export default Video;
