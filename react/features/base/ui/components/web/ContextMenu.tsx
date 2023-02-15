import React, { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import Drawer from '../../../../toolbox/components/web/Drawer';
import JitsiPortal from '../../../../toolbox/components/web/JitsiPortal';
import { showOverflowDrawer } from '../../../../toolbox/functions.web';
import participantsPaneTheme from '../../../components/themes/participantsPaneTheme.json';
import { withPixelLineHeight } from '../../../styles/functions.web';
import { spacing } from '../../Tokens';

/**
 * Get a style property from a style declaration as a float.
 *
 * @param {CSSStyleDeclaration} styles - Style declaration.
 * @param {string} name - Property name.
 * @returns {number} Float value.
 */
const getFloatStyleProperty = (styles: CSSStyleDeclaration, name: string) =>
    parseFloat(styles.getPropertyValue(name));

/**
* Gets the outer height of an element, including margins.
*
* @param {Element} element - Target element.
* @returns {number} Computed height.
*/
const getComputedOuterHeight = (element: HTMLElement) => {
    const computedStyle = getComputedStyle(element);

    return element.offsetHeight
        + getFloatStyleProperty(computedStyle, 'margin-top')
        + getFloatStyleProperty(computedStyle, 'margin-bottom');
};

interface IProps {

    /**
     * ARIA attributes.
     */
    [key: `aria-${string}`]: string;

    /**
     * Accessibility label for menu container.
     */
    accessibilityLabel?: string;

    /**
     * Children of the context menu.
     */
    children: ReactNode;

    /**
     * Class name for context menu. Used to overwrite default styles.
     */
    className?: string;

    /**
     * The entity for which the context menu is displayed.
     */
    entity?: Object;

    /**
     * Whether or not the menu is hidden. Used to overwrite the internal isHidden.
     */
    hidden?: boolean;

    /**
     * Optional id.
     */
    id?: string;

    /**
     * Whether or not the menu is already in a drawer.
     */
    inDrawer?: boolean;

    /**
     * Whether or not drawer should be open.
     */
    isDrawerOpen?: boolean;

    /**
     * Target elements against which positioning calculations are made.
     */
    offsetTarget?: HTMLElement;

    /**
     * Callback for click on an item in the menu.
     */
    onClick?: (e?: React.MouseEvent) => void;

    /**
     * Callback for drawer close.
     */
    onDrawerClose?: (e?: React.MouseEvent) => void;

    /**
     * Keydown handler.
     */
    onKeyDown?: (e?: React.KeyboardEvent) => void;

    /**
     * Callback for the mouse entering the component.
     */
    onMouseEnter?: (e?: React.MouseEvent) => void;

    /**
     * Callback for the mouse leaving the component.
     */
    onMouseLeave?: (e?: React.MouseEvent) => void;

    /**
     * Container role.
     */
    role?: string;

    /**
     * Tab index for the menu.
     */
    tabIndex?: number;
}

const MAX_HEIGHT = 400;

const useStyles = makeStyles()(theme => {
    return {
        contextMenu: {
            backgroundColor: theme.palette.ui01,
            border: `1px solid ${theme.palette.ui04}`,
            borderRadius: `${Number(theme.shape.borderRadius)}px`,
            boxShadow: '0px 1px 2px rgba(41, 41, 41, 0.25)',
            color: theme.palette.text01,
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            marginTop: `${(participantsPaneTheme.panePadding * 2) + theme.typography.bodyShortRegular.fontSize}px`,
            position: 'absolute',
            right: `${participantsPaneTheme.panePadding}px`,
            top: 0,
            zIndex: 2,
            maxHeight: `${MAX_HEIGHT}px`,
            overflowY: 'auto',
            padding: `${theme.spacing(2)} 0`
        },

        contextMenuHidden: {
            pointerEvents: 'none',
            visibility: 'hidden'
        },

        drawer: {
            paddingTop: '16px',

            '& > div': {
                ...withPixelLineHeight(theme.typography.bodyShortRegularLarge),

                '& svg': {
                    fill: theme.palette.icon01
                }
            }
        }
    };
});

const ContextMenu = ({
    accessibilityLabel,
    children,
    className,
    entity,
    hidden,
    id,
    inDrawer,
    isDrawerOpen,
    offsetTarget,
    onClick,
    onKeyDown,
    onDrawerClose,
    onMouseEnter,
    onMouseLeave,
    role,
    tabIndex,
    ...aria
}: IProps) => {
    const [ isHidden, setIsHidden ] = useState(true);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const { classes: styles, cx } = useStyles();
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

            // make sure the max height is not set
            // @ts-ignore
            container.style.maxHeight = null;
            const { offsetTop, offsetParent: { offsetHeight, scrollTop } } = offsetTarget;
            let outerHeight = getComputedOuterHeight(container);
            let height = Math.min(MAX_HEIGHT, outerHeight);

            if (offsetTop + height > offsetHeight + scrollTop && height > offsetTop) {
                // top offset and + padding + border
                container.style.maxHeight = `${offsetTop - ((spacing[2] * 2) + 2)}px`;
            }

            // get the height after style changes
            outerHeight = getComputedOuterHeight(container);
            height = Math.min(MAX_HEIGHT, outerHeight);

            container.style.top = offsetTop + height > offsetHeight + scrollTop
                ? `${offsetTop - outerHeight}`
                : `${offsetTop}`;

            setIsHidden(false);
        } else {
            hidden === undefined && setIsHidden(true);
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
                isOpen = { Boolean(isDrawerOpen && _overflowDrawer) }
                onClose = { onDrawerClose }>
                <div
                    className = { styles.drawer }
                    onClick = { onDrawerClose }>
                    {children}
                </div>
            </Drawer>
        </JitsiPortal>
        : <div
            { ...aria }
            aria-label = { accessibilityLabel }
            className = { cx(participantsPaneTheme.ignoredChildClassName,
                styles.contextMenu,
                isHidden && styles.contextMenuHidden,
                className
            ) }
            id = { id }
            onClick = { onClick }
            onKeyDown = { onKeyDown }
            onMouseEnter = { onMouseEnter }
            onMouseLeave = { onMouseLeave }
            ref = { containerRef }
            role = { role ?? 'menu' }
            tabIndex = { tabIndex }>
            {children}
        </div>;
};

export default ContextMenu;
