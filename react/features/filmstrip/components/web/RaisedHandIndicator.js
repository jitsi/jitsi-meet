/* @flow */

import React, { Component } from 'react';

import BaseIndicator from './BaseIndicator';

/**
 * The type of the React {@code Component} props of {@link RaisedHandIndicator}.
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
 * Thumbnail badge showing that the participant would like to speak.
 *
 * @extends Component
 */
class RaisedHandIndicator extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <BaseIndicator
                className = 'raisehandindicator indicator show-inline'
                iconClassName = 'icon-raised-hand indicatoricon'
                iconSize = { `${this.props.iconSize}px` }
                tooltipKey = 'raisedHand'
                tooltipPosition = { this.props.tooltipPosition } />
        );
    }
}

export default RaisedHandIndicator;
