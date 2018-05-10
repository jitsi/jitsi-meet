import React, { Component } from 'react';

import { Icon } from '../../../base/font-icons';

import styles from './styles';

/**
 * Thumbnail badge for displaying the video mute status of a participant.
 */
export default class VideoMutedIndicator extends Component {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <Icon
                name = 'camera-disabled'
                style = { styles.thumbnailIndicator } />
        );
    }
}
