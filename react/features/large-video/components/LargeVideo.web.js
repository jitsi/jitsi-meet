import React, { Component } from 'react';
import { connect } from 'react-redux';

import { addFaceTracker, FacePrompt } from '../../face-tracking';
import { Watermarks } from '../../base/react';
import { VideoStatusLabel } from '../../video-status-label';

const LARGE_VIDEO_TRACKING_DELAY = 5000;
const LARGE_VIDEO_PROMPT_DURATION = 500;
const LARGE_VIDEO_TRACKING_FPS = 5;

/**
 * Implements a React {@link Component} which represents the large video (a.k.a.
 * the conference participant who is on the local stage) on Web/React.
 *
 * @extends Component
 */
class LargeVideo extends Component {
    /**
     * LargeVideo component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Invoked to add a FaceTracker object in the middleware.
         */
        addFaceTracker: React.PropTypes.func
    };

    /**
     * Initializes a new LargeVideo instance.
     *
     * @param  {Object} props - The read-only React Component props with
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        /**
         * The internal reference to the DOM/HTML element intended for
         * displaying a video.
         *
         * @private
         * @type {Object}
         */
        this._videoElement = null;

        this._wrapperElement = null;

        this.state = {
            /**
             * Whether or not the video is in canplay state or not.
             * FacePrompt component will not be rendered until the flag is
             * set true.
             *
             * @private
             * @type {boolean}
             */
            _isVideoReady: false
        };

        this._onVideoCanPlay = this._onVideoCanPlay.bind(this);
    }

    /**
     * Obtain video element for displaying and tracking.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this._videoElement = document.getElementById('largeVideo');
        this._wrapperElement = document.getElementById('largeVideoWrapper');
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
                className = 'videocontainer'
                id = 'largeVideoContainer'>
                <div id = 'sharedVideo'>
                    <div id = 'sharedVideoIFrame' />
                </div>
                <div id = 'etherpad' />

                <Watermarks />

                <div id = 'dominantSpeaker'>
                    <div className = 'dynamic-shadow' />
                    <img
                        id = 'dominantSpeakerAvatar'
                        src = '' />
                </div>
                <span id = 'remoteConnectionMessage' />
                <div>
                    <div className = 'video_blurred_container'>
                        <video
                            autoPlay = { true }
                            id = 'largeVideoBackground'
                            muted = 'true' />
                    </div>
                    {

                        /**
                         * FIXME: the architecture of elements related to the
                         * large video and  the naming. The background is not
                         * part of largeVideoWrapper because we are controlling
                         * the size of the video through largeVideoWrapper.
                         * That's why we need another container for the the
                         * background and the largeVideoWrapper in order to
                         * hide/show them.
                         */
                    }
                    <div id = 'largeVideoWrapper'>
                        { this.state._isVideoReady
                        && this.props.addFaceTracker
                        && <FacePrompt
                            videoElement = { this._videoElement }
                            wrapperElement = { this._wrapperElement } /> }
                        <video
                            autoPlay = { true }
                            id = 'largeVideo'
                            muted = { true }
                            onCanPlay = { this._onVideoCanPlay } />
                    </div>
                </div>
                <span id = 'localConnectionMessage' />

                <VideoStatusLabel />

                <span
                    className = 'video-state-indicator centeredVideoLabel'
                    id = 'recordingLabel'>
                    <span id = 'recordingLabelText' />
                    <img
                        className = 'recordingSpinner'
                        id = 'recordingSpinner'
                        src = 'images/spin.svg' />
                </span>
            </div>
        );
    }

    /**
     * Enables FacePrompt component, and adds FaceTracker to track the video,
     * when the video is in canplay state.
     *
     * @private
     * @returns {void}
     */
    _onVideoCanPlay() {
        this.setState({ _isVideoReady: true });

        this.props.addFaceTracker({
            videoElement: this._videoElement,
            wrapperElement: this._wrapperElement,
            delay: LARGE_VIDEO_TRACKING_DELAY,
            duration: LARGE_VIDEO_PROMPT_DURATION,
            fps: LARGE_VIDEO_TRACKING_FPS
        });
    }
}

export default connect(null, { addFaceTracker })(LargeVideo);
