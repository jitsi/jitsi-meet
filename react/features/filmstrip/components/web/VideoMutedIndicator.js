import React, { Component } from 'react';
import BaseIndicator from './BaseIndicator';

/**
 * React {@code Component} for showing a video muted icon with a tooltip.
 *
 * @extends Component
 */
class VideoMutedIndicator extends Component {
    /**
     * {@code VideoMutedIndicator} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * From which side of the indicator the tooltip should appear from.
         */
        tooltipPosition: React.PropTypes.string
    };

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
                tooltipKey = 'videothumbnail.videomute'
                tooltipPosition = { this.props.tooltipPosition } />
        );
    }
}

export default VideoMutedIndicator;
