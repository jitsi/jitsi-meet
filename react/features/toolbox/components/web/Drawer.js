// @flow

import { makeStyles } from '@material-ui/core';
import React, { useCallback } from 'react';

import { DRAWER_MAX_HEIGHT } from '../../constants';


type Props = {

    /**
     * Class name for custom styles.
     */
    className: string,

    /**
     * The component(s) to be displayed within the drawer menu.
     */
    children: React$Node,

    /**
     * Whether the drawer should be shown or not.
     */
    isOpen: boolean,

    /**
     * Function that hides the drawer.
     */
    onClose: Function
};

const useStyles = makeStyles(theme => {
    return {
        drawer: {
            backgroundColor: theme.palette.ui02,
            maxHeight: `calc(${DRAWER_MAX_HEIGHT})`
        }
    };
});

/**
 * Component that displays the mobile friendly drawer on web.
 *
 * @returns {ReactElement}
 */
function Drawer({
    children,
    className = '',
    isOpen,
    onClose
}: Props) {
    const styles = useStyles();

    /**
     * Handles clicks within the menu, preventing the propagation of the click event.
     *
     * @param {Object} event - The click event.
     * @returns {void}
     */
    const handleInsideClick = useCallback(event => {
        event.stopPropagation();
    }, []);

    /**
     * Handles clicks outside of the menu, closing it, and also stopping further propagation.
     *
     * @param {Object} event - The click event.
     * @returns {void}
     */
    const handleOutsideClick = useCallback(event => {
        event.stopPropagation();
        onClose();
    }, [ onClose ]);

    return (
        isOpen ? (
            <div
                className = 'drawer-menu-container'
                onClick = { handleOutsideClick }>
                <div
                    className = { `drawer-menu ${styles.drawer} ${className}` }
                    onClick = { handleInsideClick }>
                    {children}
                </div>
            </div>
        ) : null
    );
}

export default Drawer;
