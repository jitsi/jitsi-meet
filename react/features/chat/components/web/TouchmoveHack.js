// @flow

import React, { useEffect, useRef } from 'react';

import { isMobileBrowser } from '../../../base/environment/utils';

type Props = {

    /**
     * The component(s) that need to be scrollable on mobile.
     */
   children: React$Node,

    /**
     * Whether the component is rendered within a modal.
     */
    isModal: boolean
};


/**
 * Component that disables {@code touchmove} propagation below it.
 *
 * @returns {ReactElement}
 */
function TouchmoveHack({ children, isModal }: Props) {
    if (!isModal || !isMobileBrowser()) {
        return children;
    }

    const touchMoveElementRef = useRef(null);

    /**
     * Atlaskit's {@code Modal} uses a third party library to disable touchmove events
     * which makes scrolling inside dialogs impossible. We therefore employ this hack
     * to intercept and stop the propagation of touchmove events from this wrapper that
     * is placed around the chat conversation from the {@code ChatDialog}.
     *
     * @param {Event} event - The touchmove event fired within the component.
     * @returns {void}
     */
    function handleTouchMove(event: TouchEvent) {
        event.stopImmediatePropagation();
    }

    useEffect(() => {
        if (touchMoveElementRef && touchMoveElementRef.current) {
            touchMoveElementRef.current.addEventListener('touchmove', handleTouchMove, true);
        }

        return () => {
            if (touchMoveElementRef && touchMoveElementRef.current) {
                touchMoveElementRef.current.removeEventListener('touchmove', handleTouchMove, true);
            }
        };
    }, []);

    return (
        <div
            className = 'touchmove-hack'
            ref = { touchMoveElementRef }>
            {children}
        </div>
    );
}

export default TouchmoveHack;
