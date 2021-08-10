// @flow

import { makeStyles } from '@material-ui/core/styles';
import React from 'react';

type Props = {

    /**
     * The name to be displayed within the badge.
     */
    name: string
}

const useStyles = makeStyles(theme => {
    return {
        badge: {
            background: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '3px',
            color: theme.palette.text01,
            maxWidth: '50%',
            overflow: 'hidden',
            padding: '2px 16px',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        }
    };
});

/**
 * Component that displays a name badge.
 *
 * @param {Props} props - The props of the component.
 * @returns {ReactElement}
 */
const DisplayNameBadge = ({ name }: Props) => {
    const classes = useStyles();

    return (
        <div className = { classes.badge }>
            {name}
        </div>
    );
};

export default DisplayNameBadge;
