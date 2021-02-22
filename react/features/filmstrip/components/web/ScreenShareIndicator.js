// @flow

import React from 'react';

import { IconShareDesktop } from '../../../base/icons';
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
            className = 'screenShare toolbar-icon'
            icon = { IconShareDesktop }
            iconId = 'share-desktop'
            iconSize = { 13 }
            tooltipKey = 'videothumbnail.videomute'
            tooltipPosition = { props.tooltipPosition } />
    );
}
