// @flow

import { makeStyles } from '@material-ui/styles';
import React from 'react';

import { Icon, IconRaisedHandHollow } from '../../../base/icons';

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
                size = { 15 }
                src = { IconRaisedHandHollow } />
        </div>
    );
};
