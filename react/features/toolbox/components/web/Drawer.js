// @flow

import React, { useEffect, useRef } from 'react';


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
    const drawerRef: Object = useRef(null);

    /**
     * Closes the drawer when clicking or touching outside of it.
     *
     * @param {Event} event - Mouse down/start touch event object.
     * @returns {void}
     */
    function handleOutsideClickOrTouch(event: Event) {
        if (drawerRef.current && !drawerRef.current.contains(event.target)) {
            onClose();
        }
    }

    useEffect(() => {
        window.addEventListener('mousedown', handleOutsideClickOrTouch);
        window.addEventListener('touchstart', handleOutsideClickOrTouch);

        return () => {
            window.removeEventListener('mousedown', handleOutsideClickOrTouch);
            window.removeEventListener('touchstart', handleOutsideClickOrTouch);
        };
    }, [ drawerRef ]);

    return (
        isOpen ? (
            <div
                className = 'drawer-menu'
                ref = { drawerRef }>
                {children}
            </div>
        ) : null
    );
}

export default Drawer;
