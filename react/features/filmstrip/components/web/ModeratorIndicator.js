/* @flow */

import React from 'react';

import { IconCrown } from '../../../base/icons';
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
 * @returns {Component}
 */
const ModeratorIndicator = ({ tooltipPosition }: Props) => (
    <BaseIndicator
        icon = { IconCrown }
        iconSize = { 15 }
        tooltipKey = 'videothumbnail.moderator'
        tooltipPosition = { tooltipPosition } />
);

export default ModeratorIndicator;
