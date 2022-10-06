import { Theme } from '@mui/material';
import React, { ReactElement, useCallback } from 'react';
import { makeStyles } from 'tss-react/mui';

import { DRAWER_MAX_HEIGHT } from '../../constants';


type Props = {

    /**
     * The component(s) to be displayed within the drawer menu.
     */
    children: ReactElement;

    /**
     * Class name for custom styles.
     */
    className?: string;

    /**
     * Whether the drawer should be shown or not.
     */
    isOpen: boolean;

    /**
     * Function that hides the drawer.
     */
    onClose: Function;
};

const useStyles = makeStyles()((theme: Theme) => {
    return {
        drawer: {
            backgroundColor: theme.palette.ui01,
            maxHeight: `calc(${DRAWER_MAX_HEIGHT})`,
            borderRadius: '24px 24px 0 0'
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
    const { classes: styles } = useStyles();

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
