import React from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';
import { darken, lighten } from '@mui/material/styles'; // For hover/active states

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

// Define themeColors based on _variables.scss (hardcoded for now)
const localThemeColors = {
    primaryColor: '#7B61FF',
    backgroundColorLight: '#252A3A',
    backgroundColorDark: '#1A1E2D', // For secondary button variant or hover states
    textColorPrimary: '#FFFFFF',
    textColorSecondary: '#B0B0CC',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    disabledColor: '#4A4E5E', // A darker, more desaturated version of backgroundColorLight
    hangupRed: '#FF3B30', // For destructive actions
    hoverDarkSubtle: 'rgba(255, 255, 255, 0.05)', // For tertiary hover

    // Spacing (using existing theme.spacing for consistency if possible, or define here)
    spacingUnit: 8, // Assuming theme.spacing(1) = 8px
    get spacingSmall() { return `${this.spacingUnit}px`; }, // 8px
    get spacingMedium() { return `${this.spacingUnit * 2}px`; }, // 16px
    get spacingLarge() { return `${this.spacingUnit * 3}px`; } // 24px
};

const useStyles = makeStyles()(theme => { // theme is Jitsi's existing MUI theme
    return {
        button: { // Base style for all buttons
            fontFamily: '"Inter", sans-serif', // Ensure $baseFontFamily
            borderRadius: localThemeColors.borderRadius,
            padding: `${localThemeColors.spacingSmall} ${localThemeColors.spacingMedium}`, // Default padding: 8px 16px
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none', // All buttons are borderless by default unless specified by type
            ...withPixelLineHeight(theme.typography.bodyShortBold), // Existing typography for boldness
            fontWeight: 600, // Explicit semibold
            transition: 'background-color 0.2s ease-out, color 0.2s ease-out, border-color 0.2s ease-out',
            cursor: 'pointer',
            textTransform: 'none', // Ensure buttons don't default to uppercase

            '&.focus-visible': { // Keep existing focus style for accessibility
                outline: 0,
                boxShadow: `0px 0px 0px 2px ${theme.palette.focus01}` // Use existing focus color from theme
            },

            // Default icon color within buttons
            '& div > svg, & svg': { // Target Icon component and direct SVGs
                fill: 'currentColor', // Icons inherit text color by default
            }
        },

        primary: { // Primary button style
            backgroundColor: localThemeColors.primaryColor,
            color: localThemeColors.textColorPrimary,
            '&:hover:not(.disabled)': {
                backgroundColor: lighten(localThemeColors.primaryColor, 0.1)
            },
            '&:active:not(.disabled)': {
                backgroundColor: darken(localThemeColors.primaryColor, 0.1)
            }
        },

        secondary: { // Secondary button style
            backgroundColor: localThemeColors.backgroundColorLight,
            color: localThemeColors.textColorPrimary,
            border: `1px solid ${localThemeColors.borderColor}`,
            '&:hover:not(.disabled)': {
                backgroundColor: lighten(localThemeColors.backgroundColorLight, 0.05),
                borderColor: lighten(localThemeColors.borderColor, 0.2)
            },
            '&:active:not(.disabled)': {
                backgroundColor: darken(localThemeColors.backgroundColorLight, 0.05)
            }
        },

        tertiary: { // Tertiary / Text button style
            backgroundColor: 'transparent',
            color: localThemeColors.textColorPrimary, // Or primaryColor for an accent text button
            '&:hover:not(.disabled)': {
                backgroundColor: localThemeColors.hoverDarkSubtle
            },
            '&:active:not(.disabled)': {
                backgroundColor: darken(localThemeColors.hoverDarkSubtle, 0.05) // Slightly darker subtle hover
            }
        },

        destructive: { // Destructive action button style
            backgroundColor: localThemeColors.hangupRed,
            color: localThemeColors.textColorPrimary,
            '&:hover:not(.disabled)': {
                backgroundColor: lighten(localThemeColors.hangupRed, 0.1)
            },
            '&:active:not(.disabled)': {
                backgroundColor: darken(localThemeColors.hangupRed, 0.1)
            }
        },

        disabled: { // Disabled state for all button types
            backgroundColor: localThemeColors.disabledColor,
            color: localThemeColors.textColorSecondary,
            cursor: 'not-allowed',
            border: 'none', // Ensure no border on disabled, even if type usually has one
            '&:hover': { // Override hover for disabled
                backgroundColor: localThemeColors.disabledColor,
                color: localThemeColors.textColorSecondary,
            },
            '&:active': { // Override active for disabled
                backgroundColor: localThemeColors.disabledColor,
                color: localThemeColors.textColorSecondary,
            }
        },

        // Size variations
        small: {
            padding: `calc(${localThemeColors.spacingSmall} / 2) ${localThemeColors.spacingSmall}`, // 4px 8px
            ...withPixelLineHeight(theme.typography.labelBold), // Existing typography for small
            '&.iconButton': { // If it's an icon-only button
                padding: `calc(${localThemeColors.spacingSmall} / 2)` // 4px
            }
        },
        medium: {
            // Default padding is medium: 8px 16px
            '&.iconButton': {
                padding: localThemeColors.spacingSmall // 8px
            }
        },
        large: {
            padding: `${localThemeColors.spacingMedium} ${localThemeColors.spacingLarge}`, // 16px 24px
            ...withPixelLineHeight(theme.typography.bodyShortBoldLarge), // Existing typography for large
            '&.iconButton': {
                padding: localThemeColors.spacingMedium // 16px
            }
        },

        // Icon specific styles
        iconButton: { // Base style for icon-only buttons (applied if no label)
            // Size-specific paddings handle this
        },
        textWithIcon: { // Space between icon and text
            marginLeft: localThemeColors.spacingSmall // 8px
        },

        // Full width button
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
