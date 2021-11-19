/* @flow */

import { FieldTextStateless as TextField } from '@atlaskit/field-text';
import { makeStyles } from '@material-ui/core/styles';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { getFieldValue } from '../../base/react';
import { isSpeakerStatsSearchDisabled } from '../functions';

const useStyles = makeStyles(theme => {
    return {
        speakerStatsSearch: {
            position: 'absolute',
            right: '80px',
            top: '8px',

            [theme.breakpoints.down('400')]: {
                left: 20,
                right: 0,
                top: 42
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
    const [ searchValue, setSearchValue ] = useState<string>('');
    const onChange = useCallback((evt: Event) => {
        const value = getFieldValue(evt);

        setSearchValue(value);

        onSearch && onSearch(value);
    }, []);
    const disableSpeakerStatsSearch = useSelector(isSpeakerStatsSearchDisabled);

    if (disableSpeakerStatsSearch) {
        return null;
    }

    return (
        <div className = { classes.speakerStatsSearch }>
            <TextField
                autoComplete = 'off'
                autoFocus = { false }
                compact = { true }
                name = 'speakerStatsSearch'
                onChange = { onChange }
                placeholder = { t('speakerStats.search') }
                shouldFitContainer = { false }
                type = 'text'
                value = { searchValue } />
        </div>
    );
}

export default SpeakerStatsSearch;
