// @flow

import React, { Component } from 'react';

import BaseIndicator from './BaseIndicator';

/**
 * Thumbnail badge for displaying the audio mute status of a participant.
 */
export default class AudioMutedIndicator extends Component<{}> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <BaseIndicator
                highlight = { false }
                icon = 'mic-disabled' />
        );
    }
}
