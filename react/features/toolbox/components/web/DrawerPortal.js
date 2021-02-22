// @flow

import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

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
    const [ portalTarget ] = useState(() => {
        const portalDiv = document.createElement('div');

        portalDiv.className = 'drawer-portal';

        return portalDiv;
    });

    useEffect(() => {
        if (document.body) {
            document.body.appendChild(portalTarget);
        }

        return () => {
            if (document.body) {
                document.body.removeChild(portalTarget);
            }
        };
    }, []);

    return ReactDOM.createPortal(
      children,
      portalTarget
    );
}

export default DrawerPortal;
