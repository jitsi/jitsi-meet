import React from 'react';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../base/icons/components/Icon';
import { IconMicSlash } from '../../../base/icons/svg';

const useStyles = makeStyles()(theme => {
    return {
        indicator: {
            backgroundColor: theme.palette.participantRaisedHandBadge,
            borderRadius: `${Number(theme.shape.borderRadius) / 2}px`,
            height: '24px',
            width: '24px'
        }
    };
});

export const ChatMutedIndicator = () => {
    const { classes: styles } = useStyles();

    return (
        <div className = { styles.indicator }>
            <Icon
                color = '#E04757'
                size = { 16 }
                src = { IconMicSlash } />
        </div>
    );
};
