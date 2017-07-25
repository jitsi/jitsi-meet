import React, { Component } from 'react';

import BaseIndicator from './BaseIndicator';

/**
 * Thumbnail badge showing that the participant is the dominant speaker in
 * the conference.
 *
 * @extends Component
 */
class DominantSpeakerIndicator extends Component {
    /**
     * {@code DominantSpeakerIndicator} component's property types.
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
                className = 'indicator show-inline'
                iconClassName = 'indicatoricon fa fa-bullhorn'
                iconSize = { `${this.props.iconSize}px` }
                id = 'dominantspeakerindicator'
                tooltipKey = 'speaker' />
        );
    }
}

export default DominantSpeakerIndicator;
