// @flow

import React, { useEffect, useRef, useState } from 'react';

import { Icon, IconArrowUpWide, IconArrowDownWide } from '../../../base/icons';

type Props = {

    /**
     * Whether the drawer should have a button that expands its size or not.
     */
    canExpand: ?boolean,

    /**
     * The component(s) to be displayed within the drawer menu.
     */
    children: React$Node,

    /**
     Whether the drawer should be shown or not.
     */
    isOpen: boolean,

    /**
     Function that hides the drawer.
     */
    onClose: Function
};

/**
 * Component that displays the mobile friendly drawer on web.
 *
 * @returns {ReactElement}
 */
function Drawer({
    canExpand,
    children,
    isOpen,
    onClose }: Props) {
    const [ expanded, setExpanded ] = useState(false);
    const drawerRef: Object = useRef(null);

    /**
     * Closes the drawer when clicking outside of it.
     *
     * @param {Event} event - Mouse down event object.
     * @returns {void}
     */
    function handleOutsideClick(event: MouseEvent) {
        if (drawerRef.current && !drawerRef.current.contains(event.target)) {
            onClose();
        }
    }

    useEffect(() => {
        window.addEventListener('mousedown', handleOutsideClick);

        return () => {
            window.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [ drawerRef ]);

    /**
     * Toggles the menu state between expanded/collapsed.
     *
     * @returns {void}
     */
    function toggleExpanded() {
        setExpanded(!expanded);
    }

    return (
        isOpen ? (
            <div
                className = { `drawer-menu${expanded ? ' expanded' : ''}` }
                ref = { drawerRef }>
                {canExpand && (
                    <div
                        className = 'drawer-toggle'
                        onClick = { toggleExpanded }>
                        <Icon src = { expanded ? IconArrowDownWide : IconArrowUpWide } />
                    </div>
                )}
                {children}
            </div>
        ) : null
    );
}

export default Drawer;
