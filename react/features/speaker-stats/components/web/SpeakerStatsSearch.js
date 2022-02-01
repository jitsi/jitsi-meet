/* @flow */

import { makeStyles } from '@material-ui/core/styles';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { IconSearch, Icon } from '../../../base/icons';
import { getFieldValue } from '../../../base/react';
import { MOBILE_BREAKPOINT } from '../../constants';
import { isSpeakerStatsSearchDisabled } from '../../functions';

const useStyles = makeStyles(theme => {
    return {
        speakerStatsSearchContainer: {
            position: 'relative'
        },
        searchIcon: {
            display: 'none',
            [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
                display: 'block',
                position: 'absolute',
                color: theme.palette.text03,
                left: 16,
                top: 13,
                width: 20,
                height: 20
            }
        },
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
            },
            [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
                height: 48,
                padding: '13px 16px 13px 44px',
                '&::placeholder': {
                    fontSize: 16
                }
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
        <div className = { classes.speakerStatsSearchContainer }>
            <Icon
                className = { classes.searchIcon }
                color = '#858585'
                src = { IconSearch } />

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
        </div>
    );
}

export default SpeakerStatsSearch;
