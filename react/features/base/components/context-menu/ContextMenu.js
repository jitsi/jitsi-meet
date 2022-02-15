// @flow
import { makeStyles } from '@material-ui/core';
import clsx from 'clsx';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { getComputedOuterHeight } from '../../../participants-pane/functions';
import { Drawer, JitsiPortal } from '../../../toolbox/components/web';
import { showOverflowDrawer } from '../../../toolbox/functions.web';
import participantsPaneTheme from '../themes/participantsPaneTheme.json';

type Props = {

    /**
     * Children of the context menu.
     */
    children: React$Node,

    /**
     * Class name for context menu. Used to overwrite default styles.
     */
    className?: ?string,

    /**
     * The entity for which the context menu is displayed.
     */
    entity?: Object,

    /**
     * Whether or not the menu is hidden. Used to overwrite the internal isHidden.
     */
    hidden?: boolean,

    /**
     * Whether or not the menu is already in a drawer.
     */
    inDrawer?: ?boolean,

    /**
     * Whether or not drawer should be open.
     */
    isDrawerOpen?: boolean,

    /**
     * Target elements against which positioning calculations are made.
     */
    offsetTarget?: HTMLElement,

    /**
     * Callback for click on an item in the menu.
     */
    onClick?: Function,

    /**
     * Callback for drawer close.
     */
    onDrawerClose?: Function,

    /**
     * Callback for the mouse entering the component.
     */
    onMouseEnter?: Function,

    /**
     * Callback for the mouse leaving the component.
     */
    onMouseLeave?: Function
};

const MAX_HEIGHT = 400;

const useStyles = makeStyles(theme => {
    return {
        contextMenu: {
            backgroundColor: theme.palette.ui02,
            borderRadius: `${theme.shape.borderRadius / 2}px`,
            boxShadow: '0px 3px 16px rgba(0, 0, 0, 0.6), 0px 0px 4px 1px rgba(0, 0, 0, 0.25)',
            color: theme.palette.text01,
            ...theme.typography.bodyShortRegular,
            lineHeight: `${theme.typography.bodyShortRegular.lineHeight}px`,
            marginTop: `${(participantsPaneTheme.panePadding * 2) + theme.typography.bodyShortRegular.fontSize}px`,
            position: 'absolute',
            right: `${participantsPaneTheme.panePadding}px`,
            top: 0,
            zIndex: 2,
            maxHeight: `${MAX_HEIGHT}px`,
            overflowY: 'auto'
        },

        contextMenuHidden: {
            pointerEvents: 'none',
            visibility: 'hidden'
        },

        drawer: {

            '& > div': {
                ...theme.typography.bodyShortRegularLarge,
                lineHeight: `${theme.typography.bodyShortRegularLarge.lineHeight}px`,

                '& svg': {
                    fill: theme.palette.icon01
                }
            },

            '& > *:first-child': {
                paddingTop: '15px!important'
            }
        }
    };
});

const ContextMenu = ({
    children,
    className,
    entity,
    hidden,
    inDrawer,
    isDrawerOpen,
    offsetTarget,
    onClick,
    onDrawerClose,
    onMouseEnter,
    onMouseLeave
}: Props) => {
    const [ isHidden, setIsHidden ] = useState(true);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const styles = useStyles();
    const _overflowDrawer = useSelector(showOverflowDrawer);

    useLayoutEffect(() => {
        if (_overflowDrawer) {
            return;
        }
        if (entity && offsetTarget
            && containerRef.current
            && offsetTarget?.offsetParent
            && offsetTarget.offsetParent instanceof HTMLElement
        ) {
            const { current: container } = containerRef;
            const { offsetTop, offsetParent: { offsetHeight, scrollTop } } = offsetTarget;
            const outerHeight = getComputedOuterHeight(container);
            const height = Math.min(MAX_HEIGHT, outerHeight);

            container.style.top = offsetTop + height > offsetHeight + scrollTop
                ? `${offsetTop - outerHeight}`
                : `${offsetTop}`;

            setIsHidden(false);
        } else {
            setIsHidden(true);
        }
    }, [ entity, offsetTarget, _overflowDrawer ]);

    useEffect(() => {
        if (hidden !== undefined) {
            setIsHidden(hidden);
        }
    }, [ hidden ]);

    if (_overflowDrawer && inDrawer) {
        return (<div
            className = { styles.drawer }
            onClick = { onDrawerClose }>
            {children}
        </div>);
    }

    return _overflowDrawer
        ? <JitsiPortal>
            <Drawer
                isOpen = { isDrawerOpen && _overflowDrawer }
                onClose = { onDrawerClose }>
                <div
                    className = { styles.drawer }
                    onClick = { onDrawerClose }>
                    {children}
                </div>
            </Drawer>
        </JitsiPortal>
        : <div
            className = { clsx(participantsPaneTheme.ignoredChildClassName,
                styles.contextMenu,
                isHidden && styles.contextMenuHidden,
                className
            ) }
            onClick = { onClick }
            onMouseEnter = { onMouseEnter }
            onMouseLeave = { onMouseLeave }
            ref = { containerRef }>
            {children}
        </div>
    ;
};

export default ContextMenu;
