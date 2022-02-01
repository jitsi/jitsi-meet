// @flow

import React from 'react';

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
        <div>
            {items}
        </div>
    );
};


export default SpeakerStatsList;
