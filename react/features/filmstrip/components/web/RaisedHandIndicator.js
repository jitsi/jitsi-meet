/* @flow */

import React from 'react';

import { connect } from '../../../base/redux';

import AbstractRaisedHandIndicator, {
    type Props as AbstractProps,
    _mapStateToProps
} from '../AbstractRaisedHandIndicator';

import BaseIndicator from './BaseIndicator';

/**
 * The type of the React {@code Component} props of {@link RaisedHandIndicator}.
 */
type Props = AbstractProps & {

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
class RaisedHandIndicator extends AbstractRaisedHandIndicator<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        if (!this.props._raisedHand) {
            return null;
        }

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

export default connect(_mapStateToProps)(RaisedHandIndicator);
