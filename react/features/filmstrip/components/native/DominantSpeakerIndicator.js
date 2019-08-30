// @flow

import React, { Component } from 'react';

import { IconDominantSpeaker } from '../../../base/icons';
import { BaseIndicator } from '../../../base/react';

/**
 * Thumbnail badge showing that the participant is the dominant speaker in
 * the conference.
 */
export default class DominantSpeakerIndicator extends Component<{}> {
    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <BaseIndicator
                highlight = { true }
                icon = { IconDominantSpeaker } />
        );
    }
}
