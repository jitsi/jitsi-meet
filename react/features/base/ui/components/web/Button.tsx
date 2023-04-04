import React from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../icons/components/Icon';
import { withPixelLineHeight } from '../../../styles/functions.web';
import { BUTTON_TYPES } from '../../constants.web';
import { IButtonProps } from '../types';

interface IProps extends IButtonProps {

    /**
     * Class name used for additional styles.
     */
    className?: string;

    /**
     * Whether or not the button should be full width.
     */
    fullWidth?: boolean;

    /**
     * The id of the button.
     */
    id?: string;

    /**
     * Whether or not the button is a submit form button.
     */
    isSubmit?: boolean;

    /**
     * Text to be displayed on the component.
     * Used when there's no labelKey.
     */
    label?: string;

    /**
     * Which size the button should be.
     */
    size?: 'small' | 'medium' | 'large';

    /**
     * Data test id.
     */
    testId?: string;
}

const useStyles = makeStyles()(theme => {
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

            '&.focus-visible': {
                outline: 0,
                boxShadow: `0px 0px 0px 2px ${theme.palette.focus01}`
            },

            '& div > svg': {
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

            '& div > svg': {
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

            '& div > svg': {
                fill: theme.palette.icon03
            }
        },

        iconButton: {
            padding: theme.spacing(2)
        },

        textWithIcon: {
            marginLeft: theme.spacing(2)
        },

        small: {
            padding: '8px 16px',
            ...withPixelLineHeight(theme.typography.labelBold),

            '&.iconButton': {
                padding: theme.spacing(1)
            }
        },

        medium: {},

        large: {
            padding: '13px 16px',
            ...withPixelLineHeight(theme.typography.bodyShortBoldLarge),

            '&.iconButton': {
                padding: '12px'
            }
        },

        fullWidth: {
            width: '100%'
        }
    };
});

const Button = React.forwardRef<any, any>(({
    accessibilityLabel,
    autoFocus = false,
    className,
    disabled,
    fullWidth,
    icon,
    id,
    isSubmit,
    label,
    labelKey,
    onClick = () => null,
    onKeyPress = () => null,
    size = 'medium',
    testId,
    type = BUTTON_TYPES.PRIMARY
}: IProps, ref) => {
    const { classes: styles, cx } = useStyles();
    const { t } = useTranslation();

    return (
        <button
            aria-label = { accessibilityLabel }
            autoFocus = { autoFocus }
            className = { cx(styles.button, styles[type],
                disabled && styles.disabled,
                icon && !(labelKey || label) && `${styles.iconButton} iconButton`,
                styles[size], fullWidth && styles.fullWidth, className) }
            data-testid = { testId }
            disabled = { disabled }
            { ...(id ? { id } : {}) }
            onClick = { onClick }
            onKeyPress = { onKeyPress }
            ref = { ref }
            title = { accessibilityLabel }
            type = { isSubmit ? 'submit' : 'button' }>
            {icon && <Icon
                size = { 24 }
                src = { icon } />}
            {(labelKey || label) && <span className = { icon ? styles.textWithIcon : '' }>
                {labelKey ? t(labelKey) : label}
            </span>}
        </button>
    );
});

export default Button;
