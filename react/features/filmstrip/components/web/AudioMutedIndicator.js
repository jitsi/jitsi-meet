import React, { Component } from 'react';

import BaseIndicator from './BaseIndicator';

/**
 * React {@code Component} for showing an audio muted icon with a tooltip.
 *
 * @extends Component
 */
class AudioMutedIndicator extends Component {
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
                tooltipKey = 'videothumbnail.mute' />
        );
    }
}

export default AudioMutedIndicator;
