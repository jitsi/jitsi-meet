import React from 'react';

import BaseIndicator from './BaseIndicator';

/**
 * Thumbnail badge showing that the participant would like to speak.
 *
 * @extends BaseIndicator
 */
class RaisedHandIndicator extends BaseIndicator {
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
     * Initializes a new {@code RaisedHandIndicator} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._tooltipKey = 'raisedHand';
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <span
                className = 'indicator show-inline'
                id = 'raisehandindicator'
                ref = { this._setRootElementRef }
                style = {{ fontSize: `${this.props.iconSize}px` }}>
                <i
                    className = 'icon-raised-hand indicatoricon'
                    id = 'indicatoricon' />
            </span>
        );
    }
}

export default RaisedHandIndicator;
