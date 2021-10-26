/* @flow */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import style from './styles';

/**
 * React component for labeling speaker stats column items.
 *
 * @returns {void}
 */
const SpeakerStatsLabels = () => {

    const { t } = useTranslation();

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
};

export default SpeakerStatsLabels;
