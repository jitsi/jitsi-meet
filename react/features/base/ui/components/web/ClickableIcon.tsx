import { makeStyles } from '@material-ui/core';
import clsx from 'clsx';
import React from 'react';

import { isMobileBrowser } from '../../../environment/utils';
import Icon from '../../../icons/components/Icon';
import { Theme } from '../../types';

interface IProps {
    accessibilityLabel: string;
    icon: Function;
    onClick: () => void;
}

const useStyles = makeStyles((theme: Theme) => {
    return {
        button: {
            padding: '2px',
            backgroundColor: theme.palette.action03,
            border: 0,
            outline: 0,
            borderRadius: `${theme.shape.borderRadius}px`,

            '&:hover': {
                backgroundColor: theme.palette.ui02
            },

            '&:active': {
                backgroundColor: theme.palette.ui03
            },

            '&.is-mobile': {
                padding: '10px'
            }
        }
    };
});

const ClickableIcon = ({ accessibilityLabel, icon, onClick }: IProps) => {
    const styles = useStyles();
    const isMobile = isMobileBrowser();

    return (<button
        aria-label = { accessibilityLabel }
        className = { clsx(styles.button, isMobile && 'is-mobile') }
        onClick = { onClick }>
        <Icon
            size = { 24 }
            src = { icon } />
    </button>);
};

export default ClickableIcon;
