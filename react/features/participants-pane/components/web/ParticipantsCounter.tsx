import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { getParticipantCount } from '../../../base/participants/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';

const useStyles = makeStyles()(theme => {
    return {
        badge: {
            backgroundColor: theme.palette.ui03,
            borderRadius: '100%',
            height: '16px',
            minWidth: '16px',
            color: theme.palette.text01,
            ...withPixelLineHeight(theme.typography.labelBold),
            pointerEvents: 'none',
            position: 'absolute',
            right: '-4px',
            top: '-3px',
            textAlign: 'center',
            padding: '1px'
        }
    };
});

const ParticipantsCounter = () => {
    const { classes } = useStyles();
    const participantsCount = useSelector(getParticipantCount);

    return <span className = { classes.badge }>{participantsCount}</span>;
};

export default ParticipantsCounter;
