// @flow

import React, { Component } from 'react';

import BaseIndicator from './BaseIndicator';

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
                icon = 'camera-disabled' />
        );
    }
}
