import React, { ReactNode, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { darken, lighten } from '@mui/material/styles'; // For hover/active states

import { showOverflowDrawer } from '../../../../toolbox/functions.web';
import Icon from '../../../icons/components/Icon';
import { withPixelLineHeight } from '../../../styles/functions.web';
import { TEXT_OVERFLOW_TYPES } from '../../constants.any';

import TextWithOverflow from './TextWithOverflow';

export interface IProps {

    /**
     * Label used for accessibility.
     */
    accessibilityLabel: string;

    /**
     * The context menu item background color.
     */
    backgroundColor?: string;

    /**
     * Component children.
     */
    children?: ReactNode;

    /**
     * CSS class name used for custom styles.
     */
    className?: string;

    /**
     * Id of dom element controlled by this item. Matches aria-controls.
     * Useful if you need this item as a tab element.
     *
     */
    controls?: string;

    /**
     * Custom icon. If used, the icon prop is ignored.
     * Used to allow custom children instead of just the default icons.
     */
    customIcon?: ReactNode;

    /**
     * Whether or not the action is disabled.
     */
    disabled?: boolean;

    /**
     * Default icon for action.
     */
    icon?: Function;

    /**
     * Id of the action container.
     */
    id?: string;

    /**
     * Click handler.
     */
    onClick?: (e?: React.MouseEvent<any>) => void;

    /**
     * Keydown handler.
     */
    onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;

    /**
     * Keypress handler.
     */
    onKeyPress?: (e?: React.KeyboardEvent) => void;

    /**
     * Overflow type for item text.
     */
    overflowType?: TEXT_OVERFLOW_TYPES;

    /**
     * You can use this item as a tab. Defaults to button if not set.
     *
     * If no onClick handler is provided, we assume the context menu item is
     * not interactive and no role will be set.
     */
    role?: 'tab' | 'button' | 'menuitem';

    /**
     * Whether the item is marked as selected.
     */
    selected?: boolean;

    /**
     * TestId of the element, if any.
     */
    testId?: string;

    /**
     * Action text.
     */
    text?: string;

    /**
     * Class name for the text.
     */
    textClassName?: string;
}

// Define themeColors based on _variables.scss (hardcoded for now)
const localThemeColors = {
    backgroundColorLight: '#252A3A',
    backgroundColorDark: '#1A1E2D', // For hover or selected states
    textColorPrimary: '#FFFFFF',
    textColorSecondary: '#B0B0CC',
    primaryColor: '#7B61FF',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '6px', // Slightly less than main borderRadius for menu items
    hoverDarkSubtle: 'rgba(255, 255, 255, 0.05)', // For tertiary hover
    focusOutline: '#5343D0', // A derivative of primaryColor for focus, or use primaryColor itself

    // Spacing
    spacingUnit: 8,
    get spacingSmall() { return `${this.spacingUnit}px`; }, // 8px
    get spacingMedium() { return `${this.spacingUnit * 2}px`; }, // 16px
};

const useStyles = makeStyles()(theme => { // theme is Jitsi's existing MUI theme
    return {
        contextMenuItem: {
            alignItems: 'center',
            cursor: 'pointer',
            display: 'flex',
            minHeight: '36px', // Slightly reduced minHeight
            padding: `${localThemeColors.spacingSmall} ${localThemeColors.spacingMedium}`, // 8px 16px
            boxSizing: 'border-box',
            color: localThemeColors.textColorPrimary, // Default text color
            backgroundColor: 'transparent', // Explicitly transparent
            borderRadius: localThemeColors.borderRadius, // Rounded corners for items
            margin: `0 ${localThemeColors.spacingSmall}`, // Add horizontal margin for spacing from container edge
            marginBottom: `calc(${localThemeColors.spacingSmall} / 2)`, // Small gap between items

            '& > *:not(:last-child)': { // Spacing between icon and text
                marginRight: localThemeColors.spacingMedium, // 16px
            },

            '&:hover': {
                backgroundColor: localThemeColors.hoverDarkSubtle, // Use subtle hover
                color: localThemeColors.textColorPrimary, // Ensure text color remains primary on hover
            },

            '&:active': { // Keep an active state, slightly darker than hover
                backgroundColor: darken(localThemeColors.hoverDarkSubtle, 0.1),
            },

            '&.focus-visible': { // Themed focus state
                outline: 'none', // Remove default outline
                boxShadow: `0 0 0 2px ${localThemeColors.focusOutline}`, // Themed outline
                backgroundColor: localThemeColors.hoverDarkSubtle, // Consistent with hover
            }
        },

        selected: { // Style for selected menu item
            backgroundColor: localThemeColors.primaryColor, // Use primary color for selection
            color: localThemeColors.textColorPrimary,
            // borderLeft: `3px solid ${localThemeColors.primaryColor}`, // Alternative selection style (like old one)
            // paddingLeft: '13px', // If using borderLeft
            '&:hover': { // Hover on selected item
                backgroundColor: lighten(localThemeColors.primaryColor, 0.1),
            },
            // Remove left border, use background for selection indication
            borderLeft: 'none',
            paddingLeft: localThemeColors.spacingMedium, // Restore default padding
        },

        contextMenuItemDisabled: {
            pointerEvents: 'none',
            // Text and icon color will be handled by specific classes below
        },

        contextMenuItemIcon: { // Default icon styling
            display: 'flex', // Ensure icon is flex item for alignment
            alignItems: 'center',
            '& svg': {
                fill: 'currentColor', // Inherit color from parent (text color)
                // Size is handled by Icon component's size prop (20px)
            }
        },
        contextMenuItemIconDisabled: { // Disabled icon styling
            '& svg': {
                fill: `${localThemeColors.textColorSecondary} !important`, // Ensure disabled color
            }
        },

        text: { // Default text styling
            ...withPixelLineHeight(theme.typography.bodyShortRegular), // Keep existing typography for now
            color: 'inherit', // Inherit color (textColorPrimary by default)
            flexGrow: 1, // Allow text to take available space
            overflow: 'hidden', // Needed for TextWithOverflow
        },
        contextMenuItemLabelDisabled: { // Disabled text styling
            color: `${localThemeColors.textColorSecondary} !important`,
            '&:hover': {
                background: 'none', // No hover effect on text when disabled
            }
        },

        // Drawer specific styles (keep for now, review if drawers are used with this theme)
        contextMenuItemDrawer: {
            padding: '13px 16px', // Existing drawer padding
            // Ensure drawer items also look good with new theme if they differ
        },
        drawerText: {
            ...withPixelLineHeight(theme.typography.bodyShortRegularLarge) // Existing drawer text
        }
    };
});

const ContextMenuItem = ({
    accessibilityLabel,
    backgroundColor,
    children,
    className,
    controls,
    customIcon,
    disabled,
    id,
    icon,
    onClick,
    onKeyDown,
    onKeyPress,
    overflowType,
    role = 'button',
    selected,
    testId,
    text,
    textClassName }: IProps) => {
    const { classes: styles, cx } = useStyles();
    const _overflowDrawer: boolean = useSelector(showOverflowDrawer);
    const style = backgroundColor ? { backgroundColor } : {};
    const onKeyPressHandler = useCallback(e => {
        // only trigger the fallback behavior (onClick) if we dont have any explicit keyboard event handler
        if (onClick && !onKeyPress && !onKeyDown && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick(e);
        }

        if (onKeyPress) {
            onKeyPress(e);
        }
    }, [ onClick, onKeyPress, onKeyDown ]);

    let tabIndex: undefined | 0 | -1;

    if (role === 'tab') {
        tabIndex = selected ? 0 : -1;
    }

    if ((role === 'button' || role === 'menuitem') && !disabled) {
        tabIndex = 0;
    }

    return (
        <div
            aria-controls = { controls }
            aria-disabled = { disabled }
            aria-label = { accessibilityLabel }
            aria-selected = { role === 'tab' ? selected : undefined }
            className = { cx(styles.contextMenuItem,
                    _overflowDrawer && styles.contextMenuItemDrawer,
                    disabled && styles.contextMenuItemDisabled,
                    selected && styles.selected,
                    className
            ) }
            data-testid = { testId }
            id = { id }
            key = { text }
            onClick = { disabled ? undefined : onClick }
            onKeyDown = { disabled ? undefined : onKeyDown }
            onKeyPress = { disabled ? undefined : onKeyPressHandler }
            role = { onClick ? role : undefined }
            style = { style }
            tabIndex = { onClick ? tabIndex : undefined }>
            {customIcon ? customIcon
                : icon && <Icon
                    className = { cx(styles.contextMenuItemIcon,
                        disabled && styles.contextMenuItemIconDisabled) }
                    size = { 20 }
                    src = { icon } />}
            {text && (
                <TextWithOverflow
                    className = { cx(styles.text,
                    _overflowDrawer && styles.drawerText,
                    disabled && styles.contextMenuItemLabelDisabled,
                    textClassName) }
                    overflowType = { overflowType } >
                    {text}
                </TextWithOverflow>
            )}
            {children}
        </div>
    );
};

export default ContextMenuItem;
