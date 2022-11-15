import React from 'react';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../base/icons/components/Icon';
import { IconRaiseHand } from '../../../base/icons/svg';

const useStyles = makeStyles()(theme => {
    return {
        indicator: {
            backgroundColor: theme.palette.warning02,
            borderRadius: `${Number(theme.shape.borderRadius) / 2}px`,
            height: '24px',
            width: '24px'
        }
    };
});

export const RaisedHandIndicator = () => {
    const { classes: styles, theme } = useStyles();

    return (
        <div className = { styles.indicator }>
            <Icon
                color = { theme.palette.icon04 }
                size = { 16 }
                src = { IconRaiseHand } />
        </div>
    );
};
