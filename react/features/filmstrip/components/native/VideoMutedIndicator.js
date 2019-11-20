// @flow

import React, { Component } from 'react';

import { IconCameraDisabled } from '../../../base/icons';
import { BaseIndicator } from '../../../base/react';

/**
 * Thumbnail badge for displaying the video mute status of a participant.
 */
export default class VideoMutedIndicator extends Component<{}> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <BaseIndicator
                highlight = { false }
                icon = { IconCameraDisabled } />
        );
    }
}
