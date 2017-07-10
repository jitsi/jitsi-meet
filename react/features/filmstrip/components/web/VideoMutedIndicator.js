import React, { Component } from 'react';
import BaseIndicator from './BaseIndicator';

/**
 * React {@code Component} for showing a video muted icon with a tooltip.
 *
 * @extends Component
 */
class VideoMutedIndicator extends Component {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <BaseIndicator
                className = 'videoMuted toolbar-icon'
                iconClassName = 'icon-camera-disabled'
                tooltipKey = 'videothumbnail.videomute' />
        );
    }
}

export default VideoMutedIndicator;
