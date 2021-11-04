/* @flow */

import React, { Component } from 'react';

import { IconMicDisabled } from '../../../base/icons';
import { BaseIndicator } from '../../../base/react';

/**
 * The type of the React {@code Component} props of {@link AudioMutedIndicator}.
 */
type Props = {

    /**
     * From which side of the indicator the tooltip should appear from.
     */
    tooltipPosition: string
};

/**
 * React {@code Component} for showing an audio muted icon with a tooltip.
 *
 * @augments Component
 */
class AudioMutedIndicator extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <BaseIndicator
                className = 'audioMuted toolbar-icon'
                icon = { IconMicDisabled }
                iconId = 'mic-disabled'
                iconSize = { 13 }
                tooltipKey = 'videothumbnail.mute'
                tooltipPosition = { this.props.tooltipPosition } />
        );
    }
}

export default AudioMutedIndicator;
