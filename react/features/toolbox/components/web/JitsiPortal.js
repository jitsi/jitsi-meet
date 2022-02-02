// @flow
import React from 'react';

import DialogPortal from './DialogPortal';

type Props = {

    /**
     * The component(s) to be displayed within the drawer portal.
     */
    children: React$Node,

    /**
     * Class name used to add custom styles to the portal.
     */
    className?: string
};

/**
 * Component meant to render a drawer at the bottom of the screen,
 * by creating a portal containing the component's children.
 *
 * @returns {ReactElement}
 */
function JitsiPortal({ children, className }: Props) {
    return (
        <DialogPortal className = { `drawer-portal ${className ?? ''}` }>
            { children }
        </DialogPortal>
    );
}

export default JitsiPortal;
