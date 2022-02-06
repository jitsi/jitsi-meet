// @flow

import React, { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { escapeRegexp } from '../../../base/util';
import { resetSearchCriteria, initSearch } from '../../actions';


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
    const onSearch = useCallback((criteria = '') => {
        dispatch(initSearch(escapeRegexp(criteria)));
    }
    , [ dispatch ]);

    useEffect(() => () => dispatch(resetSearchCriteria()), []);

    return (
        <JitsiScreen
            style = { style.speakerStatsContainer }>
            <SpeakerStatsSearch onSearch = { onSearch } />
            <SpeakerStatsList />
        </JitsiScreen>
    );
};

export default SpeakerStats;
