/* @flow */

import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';

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
            <View>
                <Text>
                    { t('speakerStats.name') }
                </Text>
                <Text>
                    { t('speakerStats.speakerTime') }
                </Text>
            </View>
        );
    }
}

export default translate(SpeakerStatsLabels);
