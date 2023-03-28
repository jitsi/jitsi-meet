import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { withPixelLineHeight } from '../../../../base/styles/functions.web';

interface IProps {

    /**
     * Country of the entry.
     */
    country: { code: string; dialCode: string; name: string; };

    /**
     * Entry click handler.
     */
    onEntryClick: Function;
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            display: 'flex',
            padding: '10px',
            alignItems: 'center',
            backgroundColor: theme.palette.action03,

            '&:hover': {
                backgroundColor: theme.palette.action03Hover
            }
        },

        flag: {
            marginRight: theme.spacing(2)
        },

        text: {
            color: theme.palette.text01,
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            flexGrow: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        }
    };
});

const CountryRow = ({ country, onEntryClick }: IProps) => {
    const { classes, cx } = useStyles();

    const _onClick = () => {
        onEntryClick(country);
    };

    return (
        <div
            className = { classes.container }
            // eslint-disable-next-line react/jsx-no-bind
            onClick = { _onClick }>
            <div className = { cx(classes.flag, 'iti-flag', country.code) } />
            <div className = { classes.text }>
                {`${country.name} (+${country.dialCode})`}
            </div>
        </div>
    );
};

export default CountryRow;
