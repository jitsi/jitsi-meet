// @flow

import { makeStyles } from '@material-ui/core/styles';
import React from 'react';

import { Icon, IconRaisedHandHollow } from '../../base/icons';

const useStyles = makeStyles(theme => {
    return {
        indicator: {
            backgroundColor: '#ed9e1b',
            borderRadius: theme.shape.borderRadius / 2,
            height: 24,
            width: 24
        }
    };
});

export const RaisedHandIndicator = () => {
    const classes = useStyles();

    return (
        <div className = { classes.indicator }>
            <Icon
                size = { 15 }
                src = { IconRaisedHandHollow } />
        </div>
    );
};
