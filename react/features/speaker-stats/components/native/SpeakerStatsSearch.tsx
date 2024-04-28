import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { withTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { IconSearch } from '../../../base/icons/svg';
import Input from '../../../base/ui/components/native/Input';
import { escapeRegexp } from '../../../base/util/helpers';
import { initSearch } from '../../actions.native';
import { isSpeakerStatsSearchDisabled } from '../../functions';

import styles from './styles';

/**
 * React component for display an individual user's speaker stats.
 *
 * @returns {React$Element<any>}
 */
const SpeakerStatsSearch = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [ searchQuery, setSearchQuery ] = useState('');

    const onSearch = useCallback((criteria = '') => {
        dispatch(initSearch(escapeRegexp(criteria)));
        setSearchQuery(escapeRegexp(criteria));
    }, [ dispatch ]);


    const disableSpeakerStatsSearch = useSelector(isSpeakerStatsSearchDisabled);

    if (disableSpeakerStatsSearch) {
        return null;
    }

    return (
        <Input
            accessibilityLabel = { t('speakerStats.searchHint') }
            clearable = { true }
            customStyles = {{ container: styles.customContainer }}
            icon = { IconSearch }
            onChange = { onSearch }
            placeholder = { t('speakerStats.search') }
            value = { searchQuery } />
    );
};

export default withTheme(SpeakerStatsSearch);
