import { makeStyles } from '@material-ui/core';
import clsx from 'clsx';
import React from 'react';

import Icon from '../../../icons/components/Icon';
import { withPixelLineHeight } from '../../../styles/functions.web';
import { BUTTON_TYPES } from '../../constants';
import { Theme } from '../../types';
import { ButtonProps } from '../types';


interface IButtonProps extends ButtonProps {

    /**
     * Class name used for additional styles.
     */
    className?: string,

    /**
     * Whether or not the button should be full width.
     */
    fullWidth?: boolean,

    /**
     * The id of the button.
     */
    id?: string;

    /**
     * Whether or not the button is a submit form button.
     */
    isSubmit?: boolean;

    /**
     * Click callback.
     */
    onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;

    /**
     * Which size the button should be.
     */
    size?: 'small' | 'medium' | 'large';

    /**
     * Data test id.
     */
    testId?: string;
}

const useStyles = makeStyles((theme: Theme) => {
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
    className,
    disabled,
    fullWidth,
    icon,
    id,
    isSubmit,
    label,
    onClick = () => null,
    size = 'medium',
    testId,
    type = BUTTON_TYPES.PRIMARY
}: IButtonProps) => {
    const styles = useStyles();

    return (
        <button
            aria-label = { accessibilityLabel }
            className = { clsx(styles.button, styles[type],
                disabled && styles.disabled,
                icon && !label && `${styles.iconButton} iconButton`,
                styles[size], fullWidth && styles.fullWidth, className) }
            data-testid = { testId }
            disabled = { disabled }
            { ...(id ? { id } : {}) }
            onClick = { onClick }
            title = { accessibilityLabel }
            type = { isSubmit ? 'submit' : 'button' }>
            {icon && <Icon
                size = { 20 }
                src = { icon } />}
            {label && <span className = { icon ? styles.textWithIcon : '' }>{label}</span>}
        </button>
    );
};

export default Button;
