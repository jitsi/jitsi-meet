// @flow

import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useSelector } from 'react-redux';

import { isLayoutTileView } from '../../../video-layout';

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
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },
        stageBadge: {
            padding: '2px 8px'
        },
        tileBadge: {
            padding: '2px 16px'
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
    const isTileView = useSelector(isLayoutTileView);
    const className = `${classes.badge}${isTileView ? ` ${classes.tileBadge}` : ` ${classes.stageBadge}`}`;

    return (
        <div className = { className }>
            {name}
        </div>
    );
};

export default DisplayNameBadge;
