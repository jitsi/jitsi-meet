import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { countries } from '../../../utils';

import CountryRow from './CountryRow';

interface IProps {

    /**
     * Click handler for a single entry.
     */
    onEntryClick: Function;
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            height: '190px',
            width: '343px',
            overflowY: 'auto',
            backgroundColor: theme.palette.ui01
        }
    };
});

/**
 * This component displays the dropdown for the country picker.
 *
 * @returns {ReactElement}
 */
function CountryDropdown({ onEntryClick }: IProps) {
    const { classes } = useStyles();

    return (
        <div className = { classes.container }>
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
