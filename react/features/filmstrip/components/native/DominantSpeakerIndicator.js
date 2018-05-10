import React, { Component } from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import styles from './styles';

/**
 * Thumbnail badge showing that the participant is the dominant speaker in
 * the conference.
 */
export default class DominantSpeakerIndicator extends Component {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <View style = { styles.dominantSpeakerIndicatorBackground }>
                <Icon
                    name = 'bullhorn'
                    style = { styles.dominantSpeakerIndicator } />
            </View>
        );
    }
}
