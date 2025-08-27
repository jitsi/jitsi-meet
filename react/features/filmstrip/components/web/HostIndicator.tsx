import React from 'react';

import { IconHost } from '../../../base/icons/svg';
import BaseIndicator from '../../../base/react/components/web/BaseIndicator';
import { TOOLTIP_POSITION } from '../../../base/ui/constants.any';

/**
 * The type of the React {@code Component} props of {@link HostIndicator}.
 */
interface IProps {

    /**
     * From which side of the indicator the tooltip should appear from.
     */
    tooltipPosition: TOOLTIP_POSITION;
}

/**
 * React {@code Component} for showing a host icon with a tooltip.
 *
 * @returns {JSX.Element}
 */
const HostIndicator = ({ tooltipPosition }: IProps): JSX.Element => (
    <BaseIndicator
        icon = { IconHost }
        iconSize = { 16 }
        tooltipKey = 'videothumbnail.host'
        tooltipPosition = { tooltipPosition } />
);

export default HostIndicator;
