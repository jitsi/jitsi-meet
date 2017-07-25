import React, { Component } from 'react';

import BaseIndicator from './BaseIndicator';

/**
 * React {@code Component} for showing a moderator icon with a tooltip.
 *
 * @extends Component
 */
class ModeratorIndicator extends Component {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <BaseIndicator
                className = 'focusindicator toolbar-icon right'
                iconClassName = 'icon-star'
                tooltipKey = 'videothumbnail.moderator' />
        );
    }
}

export default ModeratorIndicator;
