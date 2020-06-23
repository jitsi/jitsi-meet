/* @flow */

import React, { Component } from 'react';

import Video from '../../base/media/components/Video';

const VIDEO_ERROR_CLASS = 'video-preview-has-error';

/**
 * The type of the React {@code Component} props of {@link VideoInputPreview}.
 */
type Props = {

    /**
     * An error message to display instead of a preview. Displaying an error
     * will take priority over displaying a video preview.
     */
    error: ?string,

    /**
     * The JitsiLocalTrack to display.
     */
    track: Object
};

/**
 * React component for displaying video. This component defers to lib-jitsi-meet
 * logic for rendering the video.
 *
 * @extends Component
 */
class VideoInputPreview extends Component<Props> {
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
                <Video
                    className = 'video-input-preview-display flipVideoX'
                    playsinline = { true }
                    videoTrack = {{ jitsiTrack: this.props.track }} />
                <div className = 'video-input-preview-error'>
                    { error || '' }
                </div>
            </div>
        );
    }
}

export default VideoInputPreview;
