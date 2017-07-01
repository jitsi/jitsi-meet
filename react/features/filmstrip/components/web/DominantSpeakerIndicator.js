import React from 'react';

import BaseIndicator from './BaseIndicator';

/**
 * Thumbnail badge showing that the participant is the dominant speaker in
 * the conference.
 *
 * @extends BaseIndicator
 */
class DominantSpeakerIndicator extends BaseIndicator {
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
     * Initializes a new {@code DominantSpeakerIndicator} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._tooltipKey = 'speaker';
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
                id = 'dominantspeakerindicator'
                ref = { this._setRootElementRef }
                style = {{ fontSize: `${this.props.iconSize}px` }}>
                <i
                    className = 'indicatoricon fa fa-bullhorn'
                    id = 'indicatoricon' />
            </span>
        );
    }
}

export default DominantSpeakerIndicator;
