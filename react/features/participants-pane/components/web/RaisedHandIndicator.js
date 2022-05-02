// @flow

import { makeStyles } from '@material-ui/styles';
import React from 'react';

import { Icon, IconRaisedHandHollow } from '../../../base/icons';
import BaseTheme from '../../../base/ui/components/BaseTheme';

const useStyles = makeStyles(theme => {
    return {
        indicator: {
            backgroundColor: theme.palette.warning02,
            borderRadius: `${theme.shape.borderRadius / 2}px`,
            height: '24px',
            width: '24px'
        }
    };
});

export const RaisedHandIndicator = () => {
    const styles = useStyles();

    return (
        <div className = { styles.indicator }>
            <Icon
                color = { BaseTheme.palette.uiBackground }
                size = { 16 }
                src = { IconRaisedHandHollow } />
        </div>
    );
};
