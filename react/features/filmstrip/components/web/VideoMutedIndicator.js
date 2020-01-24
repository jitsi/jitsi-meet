/* @flow */

import React, { Component } from 'react';

import { IconCameraDisabled } from '../../../base/icons';
import { BaseIndicator } from '../../../base/react';

/**
 * The type of the React {@code Component} props of {@link VideoMutedIndicator}.
 */
type Props = {

    /**
     * From which side of the indicator the tooltip should appear from.
     */
    tooltipPosition: string
};

/**
 * React {@code Component} for showing a video muted icon with a tooltip.
 *
 * @extends Component
 */
class VideoMutedIndicator extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <BaseIndicator
                className = 'videoMuted toolbar-icon'
                icon = { IconCameraDisabled }
                iconId = 'camera-disabled'
                iconSize = { 13 }
                tooltipKey = 'videothumbnail.videomute'
                tooltipPosition = { this.props.tooltipPosition } />
        );
    }
}

export default VideoMutedIndicator;
