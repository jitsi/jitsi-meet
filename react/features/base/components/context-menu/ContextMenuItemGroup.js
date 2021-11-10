// @flow
import { makeStyles } from '@material-ui/core';
import React from 'react';

import ContextMenuItem, { type Props as Action } from './ContextMenuItem';

type Props = {

    /**
     * List of actions in this group.
     */
    actions?: Array<Action>,

    /**
     * The children of the component.
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
        }
    };
});

const ContextMenuItemGroup = ({
    actions,
    children
}: Props) => {
    const styles = useStyles();

    return (
        <div className = { styles.contextMenuItemGroup }>
            {children}
            {actions && actions.map(actionProps => (
                <ContextMenuItem
                    key = { actionProps.text }
                    { ...actionProps } />
            ))}
        </div>
    );
};

export default ContextMenuItemGroup;
