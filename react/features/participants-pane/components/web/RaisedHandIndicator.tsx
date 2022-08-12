import { makeStyles } from '@material-ui/styles';
import React from 'react';

import Icon from '../../../base/icons/components/Icon';
import { IconRaisedHandHollow } from '../../../base/icons/svg/index';
import BaseTheme from '../../../base/ui/components/BaseTheme.web';

const useStyles = makeStyles((theme: any) => {
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
