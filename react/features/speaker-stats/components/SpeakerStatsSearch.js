/* @flow */

import { FieldTextStateless as TextField } from '@atlaskit/field-text';
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { translate } from '../../base/i18n';
import { getFieldValue } from '../../base/react';

/**
 * The type of the React {@code Component} props of {@link SpeakerStatsSearch}.
 */
type Props = {

    /**
     * The function to initiate the change in the speaker stats table.
     */
    onSearch: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * React component for display an individual user's speaker stats.
 *
 * @returns {React$Element<any>}
 */
function SpeakerStatsSearch({ onSearch, t }: Props) {
    const [ searchValue, setSearchValue ] = useState<string>('');
    const onChange = useCallback((evt: Event) => {
        const value = getFieldValue(evt);

        setSearchValue(value);

        onSearch && onSearch(value);
    }, []);
    const disableSpeakerStatsSearch = useSelector(
        (state: Object) => state['features/base/config']?.disableSpeakerStatsSearch
    );

    if (disableSpeakerStatsSearch) {
        return <></>;
    }

    return (
        <div className = 'speaker-stats-search'>
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

export default translate(SpeakerStatsSearch);

