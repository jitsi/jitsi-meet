/* @flow */

import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';

import { translate } from '../../../base/i18n';

import style from './styles';

/**
 * The type of the React {@code Component} props of {@link SpeakerStatsLabels}.
 */
type Props = {

    /**
     * The function to translate human-readable text.
     */
    t: Function
};

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
            <View style = { style.speakerStatsLabelContainer } >
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
