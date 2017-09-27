import PropTypes from 'prop-types';
import React, { Component } from 'react';

import BaseIndicator from './BaseIndicator';

/**
 * React {@code Component} for showing a moderator icon with a tooltip.
 *
 * @extends Component
 */
class ModeratorIndicator extends Component {
    /**
     * {@code ModeratorIndicator} component's property types.
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
            <div className = 'moderator-icon right'>
                <BaseIndicator
                    className = 'focusindicator toolbar-icon'
                    iconClassName = 'icon-star'
                    tooltipKey = 'videothumbnail.moderator'
                    tooltipPosition = { this.props.tooltipPosition } />
            </div>
        );
    }
}

export default ModeratorIndicator;
