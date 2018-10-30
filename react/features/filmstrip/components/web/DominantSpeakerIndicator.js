/* @flow */

import React, { Component } from 'react';

import BaseIndicator from './BaseIndicator';

/**
 * The type of the React {@code Component} props of
 * {@link DominantSpeakerIndicator}.
 */
type Props = {

    /**
     * The font-size for the icon.
     */
    iconSize: number,

    /**
     * From which side of the indicator the tooltip should appear from.
     */
    tooltipPosition: string
};

/**
 * Thumbnail badge showing that the participant is the dominant speaker in
 * the conference.
 *
 * @extends Component
 */
class DominantSpeakerIndicator extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <BaseIndicator
                className = 'indicator show-inline'
                iconClassName = 'indicatoricon fa fa-bullhorn'
                iconSize = { `${this.props.iconSize}px` }
                id = 'dominantspeakerindicator'
                tooltipKey = 'speaker'
                tooltipPosition = { this.props.tooltipPosition } />
        );
    }
}

export default DominantSpeakerIndicator;
