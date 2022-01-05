// @flow

import React from 'react';

import { countries } from '../../utils';

import CountryRow from './CountryRow';

type Props = {

    /**
     * Click handler for a single entry.
     */
    onEntryClick: Function,
};

/**
 * This component displays the dropdown for the country picker.
 *
 * @returns {ReactElement}
 */
function CountryDropdown({ onEntryClick }: Props) {
    return (
        <div className = 'cpick-dropdown'>
            {countries.map(country => (
                <CountryRow
                    country = { country }
                    key = { `${country.code}` }
                    onEntryClick = { onEntryClick } />
            ))}
        </div>
    );
}

export default CountryDropdown;
