// @flow
import React from 'react';

import DialogPortal from './DialogPortal';

type Props = {

    /**
     * The component(s) to be displayed within the drawer portal.
     */
    children: React$Node
};

/**
 * Component meant to render a drawer at the bottom of the screen,
 * by creating a portal containing the component's children.
 *
 * @returns {ReactElement}
 */
function DrawerPortal({ children }: Props) {
    return (
        <DialogPortal className = 'drawer-portal'>
            { children }
        </DialogPortal>
    );
}

export default DrawerPortal;
