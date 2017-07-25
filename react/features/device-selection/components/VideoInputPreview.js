import React, { Component } from 'react';
import { connect } from 'react-redux';

import { VideoTrack } from '../../base/media';
import {
    FacePrompt,
    addFaceTracker,
    enableFaceTracking
} from '../../face-tracking';

const VIDEO_ERROR_CLASS = 'video-preview-has-error';

const PREVIEW_VIDEO_TRACKING_DELAY = 2000;
const PREVIEW_VIDEO_PROMPT_DURATION = 500;
const PREVIEW_VIDEO_TRACKING_FPS = 2;

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
         * Invoked to add a FaceTracker object in the middleware.
         */
        addFaceTracker: React.PropTypes.func,

        /**
         * Invoked to enable face tracking in the preview display.
         */
        enableFaceTracking: React.PropTypes.func,

        /**
         * An error message to display instead of a preview. Displaying an error
         * will take priority over displaying a video preview.
         */
        error: React.PropTypes.string,

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

        this._videoElement = null;

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
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { error } = this.props;
        const errorClass = error ? VIDEO_ERROR_CLASS : '';
        const className = `video-input-preview ${errorClass}`;

        return (
            <div className = { className }>
                { this.state._isVideoReady
                && this.props.addFaceTracker
                && <FacePrompt
                    videoElement = { this._videoElement } /> }
                <VideoTrack
                    className = 'video-input-preview-display flipVideoX'
                    onVideoCanPlay = { this._onVideoCanPlay }
                    triggerOnPlayingUpdate = { false }
                    videoTrack = {{ jitsiTrack: this.props.track }} />
                <div className = 'video-input-preview-error'>
                    { error || '' }
                </div>
            </div>
        );
    }

    /**
     * Enables FacePrompt component, adds and enables FaceTracker to track the
     * video, when the video is in canplay state.
     * The function is passed to {@code VideoTrack} component as a prop.
     *
     * @param {Object} event - The proxy object of canplay event.
     * @private
     * @returns {void}
     */
    _onVideoCanPlay(event) {
        this._videoElement = event.target;

        this.setState({ _isVideoReady: true });

        this.props.addFaceTracker({
            videoElement: this._videoElement,
            delay: PREVIEW_VIDEO_TRACKING_DELAY,
            duration: PREVIEW_VIDEO_PROMPT_DURATION,
            fps: PREVIEW_VIDEO_TRACKING_FPS
        });
        this.props.enableFaceTracking(this._videoElement);
    }
}

export default connect(null, {
    addFaceTracker,
    enableFaceTracking
})(VideoInputPreview);
