/* @flow */

import React from 'react';

import { IconRaisedHand } from '../../../base/icons';
import { BaseIndicator } from '../../../base/react';
import { connect } from '../../../base/redux';
import AbstractRaisedHandIndicator, {
    type Props as AbstractProps,
    _mapStateToProps
} from '../AbstractRaisedHandIndicator';

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
 * @augments Component
 */
class RaisedHandIndicator extends AbstractRaisedHandIndicator<Props> {
    /**
     * Renders the platform specific indicator element.
     *
     * @returns {React$Element<*>}
     */
    _renderIndicator() {
        return (
            <BaseIndicator
                className = 'raisehandindicator indicator show-inline'
                icon = { IconRaisedHand }
                iconClassName = 'indicatoricon'
                iconSize = { `${this.props.iconSize}px` }
                tooltipKey = 'raisedHand'
                tooltipPosition = { this.props.tooltipPosition } />
        );
    }
}

export default connect(_mapStateToProps)(RaisedHandIndicator);
