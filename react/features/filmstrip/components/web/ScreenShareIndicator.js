// @flow

import React from 'react';

import { IconScreenshare } from '../../../base/icons';
import { BaseIndicator } from '../../../base/react';


type Props = {

    /**
     * From which side of the indicator the tooltip should appear from.
     */
    tooltipPosition: string
};

/**
 * React {@code Component} for showing a screen-sharing icon with a tooltip.
 *
 * @param {Props} props - React props passed to this component.
 * @returns {React$Element<any>}
 */
export default function ScreenShareIndicator(props: Props) {
    return (
        <BaseIndicator
            icon = { IconScreenshare }
            iconId = 'share-desktop'
            iconSize = { 16 }
            tooltipKey = 'videothumbnail.screenSharing'
            tooltipPosition = { props.tooltipPosition } />
    );
}
