import React, { KeyboardEvent, ReactNode, useCallback } from 'react';
import ReactFocusLock from 'react-focus-lock';
import { makeStyles } from 'tss-react/mui';

import { DRAWER_MAX_HEIGHT } from '../../constants';


interface IProps {

    /**
     * The component(s) to be displayed within the drawer menu.
     */
    children: ReactNode;

    /**
     * Class name for custom styles.
     */
    className?: string;

    /**
     * The id of the dom element acting as the Drawer label.
     */
    headingId?: string;

    /**
     * Whether the drawer should be shown or not.
     */
    isOpen: boolean;

    /**
     * Function that hides the drawer.
     */
    onClose?: Function;
}

const useStyles = makeStyles()(theme => {
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
    headingId,
    isOpen,
    onClose
}: IProps) {
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
        onClose?.();
    }, [ onClose ]);

    /**
     * Handles pressing the escape key, closing the drawer.
     *
     * @param {KeyboardEvent<HTMLDivElement>} event - The keydown event.
     * @returns {void}
     */
    const handleEscKey = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            onClose?.();
        }
    }, [ onClose ]);

    return (
        isOpen ? (
            <div
                className = 'drawer-menu-container'
                onClick = { handleOutsideClick }
                onKeyDown = { handleEscKey }>
                <div
                    className = { `drawer-menu ${styles.drawer} ${className}` }
                    onClick = { handleInsideClick }>
                    <ReactFocusLock
                        lockProps = {{
                            role: 'dialog',
                            'aria-modal': true,
                            'aria-labelledby': `#${headingId}`
                        }}
                        returnFocus = { true }>
                        {children}
                    </ReactFocusLock>
                </div>
            </div>
        ) : null
    );
}

export default Drawer;
