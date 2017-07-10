import React, { Component } from 'react';

import BaseIndicator from './BaseIndicator';

/**
 * Thumbnail badge showing that the participant would like to speak.
 *
 * @extends Component
 */
class RaisedHandIndicator extends Component {
    /**
     * {@code RaisedHandIndicator} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The font-size for the icon.
         *
         * @type {number}
         */
        iconSize: React.PropTypes.number
    };

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
                tooltipKey = 'raisedHand' />
        );
    }
}

export default RaisedHandIndicator;
