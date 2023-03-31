import React from 'react';

import { IconMicSlash } from '../../../base/icons/svg';
import BaseIndicator from '../../../base/react/components/web/BaseIndicator';

/**
 * The type of the React {@code Component} props of {@link AudioMutedIndicator}.
 */
interface IProps {

    /**
     * From which side of the indicator the tooltip should appear from.
     */
    tooltipPosition: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * React {@code Component} for showing an audio muted icon with a tooltip.
 *
 * @returns {Component}
 */
const AudioMutedIndicator = ({ tooltipPosition }: IProps) => (
    <BaseIndicator
        icon = { IconMicSlash }
        iconId = 'mic-disabled'
        iconSize = { 16 }
        id = 'audioMuted'
        tooltipKey = 'videothumbnail.mute'
        tooltipPosition = { tooltipPosition } />
);

export default AudioMutedIndicator;
