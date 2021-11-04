/* @flow */

import React, { Component } from 'react';

import { IconModerator } from '../../../base/icons';
import { BaseIndicator } from '../../../base/react';

/**
 * The type of the React {@code Component} props of {@link ModeratorIndicator}.
 */
type Props = {

    /**
     * From which side of the indicator the tooltip should appear from.
     */
    tooltipPosition: string
};

/**
 * React {@code Component} for showing a moderator icon with a tooltip.
 *
 * @augments Component
 */
class ModeratorIndicator extends Component<Props> {
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
                    icon = { IconModerator }
                    iconSize = { 13 }
                    tooltipKey = 'videothumbnail.moderator'
                    tooltipPosition = { this.props.tooltipPosition } />
            </div>
        );
    }
}

export default ModeratorIndicator;
