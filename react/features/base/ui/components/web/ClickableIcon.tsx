import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { isMobileBrowser } from '../../../environment/utils';
import Icon from '../../../icons/components/Icon';

interface IProps {
    accessibilityLabel: string;
    className?: string;
    icon: Function;
    id?: string;
    onClick: () => void;
}

const useStyles = makeStyles()(theme => {
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

            '&.focus-visible': {
                outline: 0,
                boxShadow: `0px 0px 0px 2px ${theme.palette.focus01}`
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

const ClickableIcon = ({ accessibilityLabel, className, icon, id, onClick }: IProps) => {
    const { classes: styles, cx } = useStyles();
    const isMobile = isMobileBrowser();

    return (
        <button
            aria-label = { accessibilityLabel }
            className = { cx(styles.button, isMobile && 'is-mobile', className) }
            id = { id }
            onClick = { onClick }>
            <Icon
                size = { 24 }
                src = { icon } />
        </button>
    );
};

export default ClickableIcon;
