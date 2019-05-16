/* @flow */

import React, { Component } from 'react';

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
 * @extends Component
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
                iconClassName = 'icon-mic-disabled'
                tooltipKey = 'videothumbnail.mute'
                tooltipPosition = { this.props.tooltipPosition } />
        );
    }
}

export default AudioMutedIndicator;
