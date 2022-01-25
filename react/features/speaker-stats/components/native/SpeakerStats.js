// @flow

import React from 'react';

import JitsiScreen from '../../../base/modal/components/JitsiScreen';

import SpeakerStatsList from './SpeakerStatsList';
import style from './styles';

/**
 * Component that renders the list of speaker stats.
 *
 * @returns {React$Element<any>}
 */
const SpeakerStats = () => (
    <JitsiScreen
        style = { style.speakerStatsContainer }>
        <SpeakerStatsList />
    </JitsiScreen>
);

export default SpeakerStats;
