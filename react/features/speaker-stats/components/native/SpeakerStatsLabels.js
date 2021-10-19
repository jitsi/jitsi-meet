/* @flow */

import React, { PureComponent } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { translate } from '../../../base/i18n';

/**
 * The type of the React {@code Component} props of {@link SpeakerStatsLabels}.
 */
type Props = {

    /**
     * The function to translate human-readable text.
     */
    t: Function
};

const style = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'row'
    },
    dummyElement: {
        flex: 1
    },
    speakerName: {
        flex: 8
    },
    speakerTime: {
        flex: 12
    }
});

/**
 * React component for labeling speaker stats column items.
 *
 * @extends Component
 */
class SpeakerStatsLabels extends PureComponent<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <View style = { style.container }>
                <View style = { style.dummyElement } />
                <View style = { style.speakerName }>
                    <Text>
                        { t('speakerStats.name') }
                    </Text>
                </View>
                <View style = { style.speakerTime }>
                    <Text>
                        { t('speakerStats.speakerTime') }
                    </Text>
                </View>
            </View>
        );
    }
}

export default translate(SpeakerStatsLabels);
