/* @flow */

import { FieldTextStateless as TextField } from '@atlaskit/field-text';
import { makeStyles } from '@material-ui/core/styles';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';

import { getFieldValue } from '../../../base/react';
import { escapeRegexp } from '../../../base/util';
import { initSearch } from '../../actions';
import { isSpeakerStatsSearchDisabled } from '../../functions';

const useStyles = makeStyles(() => {
    return {
        speakerStatsSearch: {
            position: 'absolute',
            left: 20,
            top: 60

            // [theme.breakpoints.down('400')]: {
            //     left: 20,
            //     right: 0,
            //     top: 42
            // }
        }
    };
});

/**
 * React component for display an individual user's speaker stats.
 *
 * @returns {React$Element<any>}
 */
function SpeakerStatsSearch() {
    const classes = useStyles();
    const { t } = useTranslation();
    const [ searchValue, setSearchValue ] = useState<string>('');
    const dispatch = useDispatch();
    const onChange = useCallback((evt: Event) => {
        const value = getFieldValue(evt);

        setSearchValue(value);
        dispatch(initSearch(escapeRegexp(value)));
    }, []);
    const disableSpeakerStatsSearch = useSelector(isSpeakerStatsSearchDisabled);
    const preventDismiss = useCallback((evt: KeyboardEvent) => {
        if (evt.key === 'Enter') {
            evt.preventDefault();
        }
    }, []);

    if (disableSpeakerStatsSearch) {
        return null;
    }

    return (
        <div className = { classes.speakerStatsSearch }>
            <TextField
                autoComplete = 'off'
                autoFocus = { false }
                name = 'speakerStatsSearch'
                onChange = { onChange }
                onKeyPress = { preventDismiss }
                placeholder = { t('speakerStats.search') }
                shouldFitContainer = { false }
                type = 'text'
                value = { searchValue } />
        </div>
    );
}

export default SpeakerStatsSearch;
