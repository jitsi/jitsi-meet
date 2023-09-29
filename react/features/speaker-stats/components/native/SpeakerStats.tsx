import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { resetSearchCriteria } from '../../actions.native';

import SpeakerStatsList from './SpeakerStatsList';
import SpeakerStatsSearch from './SpeakerStatsSearch';
import style from './styles';

/**
 * Component that renders the list of speaker stats.
 *
 * @returns {React$Element<any>}
 */
const SpeakerStats = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(resetSearchCriteria());
    }, []);

    return (
        <JitsiScreen
            style = { style.speakerStatsContainer }>
            <SpeakerStatsSearch />
            <SpeakerStatsList />
        </JitsiScreen>
    );
};

export default SpeakerStats;
