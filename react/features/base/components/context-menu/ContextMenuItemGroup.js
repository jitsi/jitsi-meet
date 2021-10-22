// @flow
import { makeStyles } from '@material-ui/core';
import clsx from 'clsx';
import React from 'react';
import { useSelector } from 'react-redux';

import { showOverflowDrawer } from '../../../toolbox/functions.web';
import { Icon } from '../../icons';

export type Action = {

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
     * Action text.
     */
    text: string
}

type Props = {

    /**
     * List of actions in this group.
     */
    actions?: Array<Action>,

    /**
     * The children of the component
     */
    children?: React$Node,
};


const useStyles = makeStyles(theme => {
    return {
        contextMenuItemGroup: {
            '&:not(:empty)': {
                padding: `${theme.spacing(2)}px 0`
            },

            '& + &:not(:empty)': {
                borderTop: `1px solid ${theme.palette.ui04}`
            }
        },

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

const ContextMenuItemGroup = ({
    actions,
    children
}: Props) => {
    const styles = useStyles();
    const _overflowDrawer = useSelector(showOverflowDrawer);

    return (
        <div className = { styles.contextMenuItemGroup }>
            {children}
            {actions && actions.map(({ accessibilityLabel, className, customIcon, id, icon, onClick, text }) => (
                <div
                    aria-label = { accessibilityLabel }
                    className = { clsx(styles.contextMenuItem,
                        _overflowDrawer && styles.contextMenuItemDrawer,
                        className
                    ) }
                    id = { id }
                    key = { text }
                    onClick = { onClick }>
                    {customIcon ? customIcon
                        : icon && <Icon
                            className = { styles.contextMenuItemIcon }
                            size = { 20 }
                            src = { icon } />}
                    <span>{text}</span>
                </div>
            ))}
        </div>
    );
};

export default ContextMenuItemGroup;
