import React from 'react';

import { IconModerator } from '../../../base/icons/svg';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { BaseIndicator } from '../../../base/react';

/**
 * The type of the React {@code Component} props of {@link ModeratorIndicator}.
 */
interface IProps {

    /**
     * From which side of the indicator the tooltip should appear from.
     */
    tooltipPosition: string;
}

/**
 * React {@code Component} for showing a moderator icon with a tooltip.
 *
 * @returns {JSX.Element}
 */
const ModeratorIndicator = ({ tooltipPosition }: IProps): JSX.Element => (
    <BaseIndicator
        icon = { IconModerator }
        iconSize = { 16 }
        tooltipKey = 'videothumbnail.moderator'
        tooltipPosition = { tooltipPosition } />
);

export default ModeratorIndicator;
