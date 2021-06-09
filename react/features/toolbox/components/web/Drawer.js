// @flow

import React from 'react';


type Props = {

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

/**
 * Component that displays the mobile friendly drawer on web.
 *
 * @returns {ReactElement}
 */
function Drawer({
    children,
    isOpen,
    onClose }: Props) {

    /**
     * Handles clicks within the menu, preventing the propagation of the click event.
     *
     * @param {Object} event - The click event.
     * @returns {void}
     */
    function handleInsideClick(event) {
        event.stopPropagation();
    }

    /**
     * Handles clicks outside of the menu, closing it, and also stopping further propagation.
     *
     * @param {Object} event - The click event.
     * @returns {void}
     */
    function handleOutsideClick(event) {
        event.stopPropagation();
        onClose();
    }

    return (
        isOpen ? (
            <div
                className = 'drawer-menu-container'
                onClick = { handleOutsideClick }>
                <div
                    className = 'drawer-menu'
                    onClick = { handleInsideClick }>
                    {children}
                </div>
            </div>
        ) : null
    );
}

export default Drawer;
