import { makeStyles } from '@material-ui/core/styles';
import React from 'react';

interface Theme {
    palette: any;
    text01: string;
}

const useStyles = makeStyles((theme: Theme) => {
    const { text01 } = theme.palette;

    return {
        badge: {
            background: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '3px',
            color: text01,
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
const DisplayNameBadge: React.FC<{ name: string }> = ({ name }) => {
    const classes = useStyles();

    return (
        <div className = { classes.badge }>
            { name }
        </div>
    );
};

export default DisplayNameBadge;
