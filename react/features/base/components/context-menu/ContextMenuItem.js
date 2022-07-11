// @flow

import { makeStyles } from '@material-ui/styles';
import clsx from 'clsx';
import React from 'react';
import { useSelector } from 'react-redux';

import { showOverflowDrawer } from '../../../toolbox/functions.web';
import { Icon } from '../../icons';

export type Props = {

    /**
     * Label used for accessibility.
     */
    accessibilityLabel: string,

    /**
     * CSS class name used for custom styles.
     */
    className?: string,

    /**
     * Custom icon. If used, the icon prop is ignored.
     * Used to allow custom children instead of just the default icons.
     */
    customIcon?: React$Node,

    /**
     * Whether or not the action is disabled.
     */
    disabled?: boolean,

    /**
     * Id of the action container.
     */
    id?: string,

    /**
     * Default icon for action.
     */
    icon?: Function,

    /**
     * Click handler.
     */
    onClick?: Function,

    /**
     * Keydown handler.
     */
    onKeyDown?: Function,

    /**
     * Keypress handler.
     */
    onKeyPress?: Function,

    /**
     * TestId of the element, if any.
     */
    testId?: string,

    /**
     * Action text.
     */
    text: string,

    /**
     * Class name for the text.
     */
    textClassName?: string
}

const useStyles = makeStyles(theme => {
    return {
        contextMenuItem: {
            alignItems: 'center',
            cursor: 'pointer',
            display: 'flex',
            minHeight: '40px',
            padding: '10px 16px',
            boxSizing: 'border-box',

            '& > *:not(:last-child)': {
                marginRight: `${theme.spacing(3)}px`
            },

            '&:hover': {
                backgroundColor: theme.palette.ui04
            }
        },

        contextMenuItemDisabled: {
            pointerEvents: 'none'
        },

        contextMenuItemDrawer: {
            padding: '12px 16px'
        },

        contextMenuItemIcon: {
            '& svg': {
                fill: theme.palette.icon01
            }
        }
    };
});

const ContextMenuItem = ({
    accessibilityLabel,
    className,
    customIcon,
    disabled,
    id,
    icon,
    onClick,
    onKeyDown,
    onKeyPress,
    testId,
    text,
    textClassName }: Props) => {
    const styles = useStyles();
    const _overflowDrawer = useSelector(showOverflowDrawer);

    return (
        <div
            aria-disabled = { disabled }
            aria-label = { accessibilityLabel }
            className = { clsx(styles.contextMenuItem,
                    _overflowDrawer && styles.contextMenuItemDrawer,
                    disabled && styles.contextMenuItemDisabled,
                    className
            ) }
            data-testid = { testId }
            id = { id }
            key = { text }
            onClick = { disabled ? undefined : onClick }
            onKeyDown = { disabled ? undefined : onKeyDown }
            onKeyPress = { disabled ? undefined : onKeyPress }>
            {customIcon ? customIcon
                : icon && <Icon
                    className = { styles.contextMenuItemIcon }
                    size = { 20 }
                    src = { icon } />}
            <span className = { textClassName ?? '' }>{text}</span>
        </div>
    );
};

export default ContextMenuItem;
