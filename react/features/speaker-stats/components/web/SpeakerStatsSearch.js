/* @flow */

import { makeStyles } from '@material-ui/core/styles';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { getFieldValue } from '../../../base/react';
import { isSpeakerStatsSearchDisabled } from '../../functions';

const useStyles = makeStyles(theme => {
    return {
        speakerStatsSearch: {
            backgroundColor: theme.palette.field01,
            border: '1px solid',
            borderRadius: 6,
            borderColor: theme.palette.border02,
            color: theme.palette.text01,
            padding: '10px 16px',
            width: '100%',
            height: 40,
            '&::placeholder': {
                color: theme.palette.text03,
                fontSize: 14,
                fontWeight: 400
            }
        }
    };
});

/**
 * The type of the React {@code Component} props of {@link SpeakerStatsSearch}.
 */
type Props = {

    /**
     * The function to initiate the change in the speaker stats table.
     */
    onSearch: Function,

};


/**
 * React component for display an individual user's speaker stats.
 *
 * @returns {React$Element<any>}
 */
function SpeakerStatsSearch({ onSearch }: Props) {
    const classes = useStyles();
    const { t } = useTranslation();

    const disableSpeakerStatsSearch = useSelector(isSpeakerStatsSearchDisabled);
    const [ searchValue, setSearchValue ] = useState<string>('');
    const onChange = useCallback((evt: Event) => {
        const value = getFieldValue(evt);

        setSearchValue(value);
        onSearch && onSearch(value);
    }, []);
    const preventDismiss = useCallback((evt: KeyboardEvent) => {
        if (evt.key === 'Enter') {
            evt.preventDefault();
        }
    }, []);

    if (disableSpeakerStatsSearch) {
        return null;
    }

    return (
        <input
            autoComplete = 'off'
            autoFocus = { false }
            className = { classes.speakerStatsSearch }
            id = 'speaker-stats-search'
            name = 'speakerStatsSearch'
            onChange = { onChange }
            onKeyPress = { preventDismiss }
            placeholder = { t('speakerStats.search') }
            tabIndex = { 0 }
            value = { searchValue } />
    );
}

export default SpeakerStatsSearch;
