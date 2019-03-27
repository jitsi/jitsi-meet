// @flow

import React, { Component } from 'react';
import { View } from 'react-native';

import { Icon } from '../../../base/font-icons';

import styles from './styles';

/**
 * Thumbnail badge showing that the participant is the dominant speaker in
 * the conference.
 */
export default class DominantSpeakerIndicator extends Component<{}> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <View style = { styles.indicatorBackground }>
                <Icon
                    name = 'dominant-speaker'
                    style = { styles.indicator } />
            </View>
        );
    }
}
