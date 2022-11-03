import React, { ReactElement, useEffect, useRef } from 'react';
import { makeStyles } from 'tss-react/mui';

import { isMobileBrowser } from '../../../base/environment/utils';

interface IProps {

    /**
     * The component(s) that need to be scrollable on mobile.
     */
    children: ReactElement;

    /**
     * Whether the component should be flex container or not.
     */
    flex?: boolean;

    /**
     * Whether the component is rendered within a modal.
     */
    isModal: boolean;

}

const useStyles = makeStyles()(() => {
    return {
        flex: {
            display: 'flex',
            flex: 1
        },
        base: {
            height: '100%',
            overflow: 'auto'
        }
    };
});

/**
 * Component that disables {@code touchmove} propagation below it.
 *
 * @returns {ReactElement}
 */
function TouchmoveHack({ children, isModal, flex }: IProps) {
    if (!isModal || !isMobileBrowser()) {
        return children;
    }

    const touchMoveElementRef = useRef<HTMLDivElement>(null);

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
        if (touchMoveElementRef?.current) {
            touchMoveElementRef.current.addEventListener('touchmove', handleTouchMove, true);
        }

        return () => {
            if (touchMoveElementRef?.current) {
                touchMoveElementRef.current.removeEventListener('touchmove', handleTouchMove, true);
            }
        };
    }, []);
    const { classes, cx } = useStyles();

    return (
        <div
            className = { cx(classes.base, flex && classes.flex) }
            ref = { touchMoveElementRef }>
            {children}
        </div>
    );
}

export default TouchmoveHack;
