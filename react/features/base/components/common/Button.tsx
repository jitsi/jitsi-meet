import { makeStyles } from '@material-ui/core';
import clsx from 'clsx';
import React from 'react';

import Icon from '../../icons/components/Icon';
import { BUTTON_TYPES } from '../../react/constants';
import { withPixelLineHeight } from '../../styles/functions.web';

import { ButtonProps } from './types';

interface IButtonProps extends ButtonProps {

    /**
     * Whether or not the button should be full width.
     */
    fullWidth?: boolean,

    /**
     * The id of the button.
     */
    id?: string;

    /**
     * Click callback.
     */
    onClick: () => void;

    /**
     * Which size the button should be.
     */
    size?: 'small' | 'medium' | 'large';
}

const useStyles = makeStyles((theme: any) => {
    return {
        button: {
            backgroundColor: theme.palette.action01,
            color: theme.palette.text01,
            borderRadius: theme.shape.borderRadius,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 0,
            ...withPixelLineHeight(theme.typography.bodyShortBold),
            transition: 'background .2s',
            cursor: 'pointer',

            '&:hover': {
                backgroundColor: theme.palette.action01Hover
            },

            '&:active': {
                backgroundColor: theme.palette.action01Active
            },

            '&:focus': {
                outline: 0,
                boxShadow: `0px 0px 0px 2px ${theme.palette.focus01}`
            },

            '& svg': {
                fill: theme.palette.icon01
            }
        },

        primary: {},

        secondary: {
            backgroundColor: theme.palette.action02,
            color: theme.palette.text04,

            '&:hover': {
                backgroundColor: theme.palette.action02Hover
            },

            '&:active': {
                backgroundColor: theme.palette.action02Active
            },

            '& svg': {
                fill: theme.palette.icon04
            }
        },

        tertiary: {
            backgroundColor: theme.palette.action03,

            '&:hover': {
                backgroundColor: theme.palette.action03Hover
            },

            '&:active': {
                backgroundColor: theme.palette.action03Active
            }
        },

        destructive: {
            backgroundColor: theme.palette.actionDanger,

            '&:hover': {
                backgroundColor: theme.palette.actionDangerHover
            },

            '&:active': {
                backgroundColor: theme.palette.actionDangerActive
            }
        },

        disabled: {
            backgroundColor: theme.palette.disabled01,
            color: theme.palette.text03,

            '&:hover': {
                backgroundColor: theme.palette.disabled01,
                color: theme.palette.text03
            },

            '&:active': {
                backgroundColor: theme.palette.disabled01,
                color: theme.palette.text03
            },

            '& svg': {
                fill: theme.palette.icon03
            }
        },

        iconButton: {
            padding: '10px'
        },

        textWithIcon: {
            marginLeft: `${theme.spacing(2)}px`
        },

        small: {
            padding: '8px 16px',
            ...withPixelLineHeight(theme.typography.labelBold),

            '&.iconButton': {
                padding: '6px'
            }
        },

        medium: {},

        large: {
            padding: '13px 16px',
            ...withPixelLineHeight(theme.typography.bodyShortBoldLarge),

            '&.iconButton': {
                padding: '14px'
            }
        },

        fullWidth: {
            width: '100%'
        }
    };
});

const Button = ({
    accessibilityLabel,
    disabled,
    fullWidth,
    icon,
    id,
    label,
    onClick,
    size = 'medium',
    type = BUTTON_TYPES.PRIMARY
}: IButtonProps) => {
    const styles = useStyles();

    return (
        <button
            aria-label = { accessibilityLabel }
            className = { clsx(styles.button, styles[type],
                disabled && styles.disabled,
                icon && !label && `${styles.iconButton} iconButton`,
                styles[size], fullWidth && styles.fullWidth) }
            disabled = { disabled }
            { ...(id ? { id } : {}) }
            onClick = { onClick }
            type = 'button'>
            {icon && <Icon
                size = { 20 }
                src = { icon } />}
            {label && <span className = { icon ? styles.textWithIcon : '' }>{label}</span>}
        </button>
    );
};

export default Button;
