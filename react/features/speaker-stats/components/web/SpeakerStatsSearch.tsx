import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../base/icons/components/Icon';
import { IconSearch } from '../../../base/icons/svg';
import { getFieldValue } from '../../../base/react/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { MOBILE_BREAKPOINT } from '../../constants';
import { isSpeakerStatsSearchDisabled } from '../../functions';

const useStyles = makeStyles()(theme => {
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
            borderColor: theme.palette.ui05,
            color: theme.palette.text01,
            padding: '10px 16px',
            width: '100%',
            height: 40,
            '&::placeholder': {
                color: theme.palette.text03,
                ...withPixelLineHeight(theme.typography.bodyShortRegular)
            },
            [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
                height: 48,
                padding: '13px 16px 13px 44px',
                '&::placeholder': {
                    ...withPixelLineHeight(theme.typography.bodyShortRegular)
                }
            }
        }
    };
});

/**
 * The type of the React {@code Component} props of {@link SpeakerStatsSearch}.
 */
interface IProps {

    /**
     * The function to initiate the change in the speaker stats table.
     */
    onSearch: Function;

}

/**
 * React component for display an individual user's speaker stats.
 *
 * @returns {React$Element<any>}
 */
function SpeakerStatsSearch({ onSearch }: IProps) {
    const { classes, theme } = useStyles();
    const { t } = useTranslation();
    const disableSpeakerStatsSearch = useSelector(isSpeakerStatsSearchDisabled);
    const [ searchValue, setSearchValue ] = useState<string>('');

    /**
     * Callback for the onChange event of the field.
     *
     * @param {Object} evt - The static event.
     * @returns {void}
     */
    const onChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
        const value = getFieldValue(evt);

        setSearchValue(value);
        onSearch?.(value);
    }, []);
    const preventDismiss = useCallback((evt: React.KeyboardEvent) => {
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
                color = { theme.palette.icon03 }
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
