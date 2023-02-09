/* eslint-disable lines-around-comment */

import React from 'react';

// @ts-ignore
import { IconModerator } from '../../../base/icons';
// @ts-ignore
import { BaseIndicator } from '../../../base/react';

/**
 * The type of the React {@code Component} props of {@link ModeratorIndicator}.
 */
type Props = {

    /**
     * From which side of the indicator the tooltip should appear from.
     */
    tooltipPosition: string;
};

/**
 * React {@code Component} for showing a moderator icon with a tooltip.
 *
 * @returns {JSX.Element}
 */
const ModeratorIndicator = ({ tooltipPosition }: Props): JSX.Element => (
    <BaseIndicator
        icon = { IconModerator }
        iconSize = { 16 }
        tooltipKey = 'videothumbnail.moderator'
        tooltipPosition = { tooltipPosition } />
);

export default ModeratorIndicator;
