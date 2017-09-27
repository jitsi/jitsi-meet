import PropTypes from 'prop-types';
import React, { Component } from 'react';

import BaseIndicator from './BaseIndicator';

/**
 * React {@code Component} for showing an audio muted icon with a tooltip.
 *
 * @extends Component
 */
class AudioMutedIndicator extends Component {
    /**
     * {@code AudioMutedIndicator} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * From which side of the indicator the tooltip should appear from.
         */
        tooltipPosition: PropTypes.string
    };

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
