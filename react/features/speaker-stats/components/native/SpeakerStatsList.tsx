import React from 'react';
import { View } from 'react-native';

import abstractSpeakerStatsList from '../AbstractSpeakerStatsList';

import SpeakerStatsItem from './SpeakerStatsItem';

/**
 * Component that renders the list of speaker stats.
 *
 * @returns {React$Element<any>}
 */
const SpeakerStatsList = () => {
    const items = abstractSpeakerStatsList(SpeakerStatsItem);

    return (
        <View>
            {items}
        </View>
    );
};

export default SpeakerStatsList;
