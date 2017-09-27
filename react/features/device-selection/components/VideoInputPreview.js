import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Video } from '../../base/media';

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
        error: PropTypes.string,

        /**
         * The JitsiLocalTrack to display.
         */
        track: PropTypes.object
    };

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
                    videoTrack = {{ jitsiTrack: this.props.track }} />
                <div className = 'video-input-preview-error'>
                    { error || '' }
                </div>
            </div>
        );
    }
}

export default VideoInputPreview;
