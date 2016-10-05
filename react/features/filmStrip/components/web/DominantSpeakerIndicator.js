import React, { Component } from 'react';
import Icon from 'react-fontawesome';

import { styles } from './styles';

/**
 * Thumbnail badge showing that the participant is the dominant speaker in
 * the conference.
 */
export class DominantSpeakerIndicator extends Component {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <div style = { styles.dominantSpeakerIndicatorBackground }>
                <Icon
                    name = 'bullhorn'
                    style = { styles.dominantSpeakerIndicator } />
            </div>
        );
    }
}
