import React, { KeyboardEvent, ReactNode, useCallback } from 'react';
import { FocusOn } from 'react-focus-on';
import { makeStyles } from 'tss-react/mui';

import { isElementInTheViewport } from '../../../base/ui/functions.web';
import { DRAWER_MAX_HEIGHT } from '../../constants';


interface IProps {

    /**
     * The component(s) to be displayed within the drawer menu.
     */
    children: ReactNode;

    /**
     * Class name for custom styles.
     */
    className?: string;

    /**
     * The id of the dom element acting as the Drawer label.
     */
    headingId?: string;

    /**
     * Whether the drawer should be shown or not.
     */
    isOpen: boolean;

    /**
     * Function that hides the drawer.
     */
    onClose?: Function;
}

const useStyles = makeStyles()(theme => {
    return {
        drawerMenuContainer: {
            height: '100dvh',
            display: 'flex',
            alignItems: 'flex-end'
        },

        drawer: {
            backgroundColor: theme.palette.ui01,
            maxHeight: `calc(${DRAWER_MAX_HEIGHT})`,
            borderRadius: '24px 24px 0 0',
            overflowY: 'auto',
            marginBottom: 'env(safe-area-inset-bottom, 0)',
            width: '100%',

            '& .overflow-menu': {
                margin: 'auto',
                fontSize: '1.2em',
                listStyleType: 'none',
                padding: 0,
                height: 'calc(80vh - 144px - 64px)',
                overflowY: 'auto',

                '& .overflow-menu-item': {
                    boxSizing: 'border-box',
                    height: '48px',
                    padding: '12px 16px',
                    alignItems: 'center',
                    color: theme.palette.text01,
                    cursor: 'pointer',
                    display: 'flex',
                    fontSize: '16px',

                    '& div': {
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center'
                    },

                    '&.disabled': {
                        cursor: 'initial',
                        color: '#3b475c'
                    }
                }
            }
        }
    };
});

/**
 * Component that displays the mobile friendly drawer on web.
 *
 * @returns {ReactElement}
 */
function Drawer({
    children,
    className = '',
    headingId,
    isOpen,
    onClose
}: IProps) {
    const { classes, cx } = useStyles();

    /**
     * Handles clicks within the menu, preventing the propagation of the click event.
     *
     * @param {Object} event - The click event.
     * @returns {void}
     */
    const handleInsideClick = useCallback(event => {
        event.stopPropagation();
    }, []);

    /**
     * Handles clicks outside of the menu, closing it, and also stopping further propagation.
     *
     * @param {Object} event - The click event.
     * @returns {void}
     */
    const handleOutsideClick = useCallback(event => {
        event.stopPropagation();
        onClose?.();
    }, [ onClose ]);

    /**
     * Handles pressing the escape key, closing the drawer.
     *
     * @param {KeyboardEvent<HTMLDivElement>} event - The keydown event.
     * @returns {void}
     */
    const handleEscKey = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            onClose?.();
        }
    }, [ onClose ]);

    return (
        isOpen ? (
            <div
                className = { classes.drawerMenuContainer }
                onClick = { handleOutsideClick }
                onKeyDown = { handleEscKey }>
                <div
                    className = { cx(classes.drawer, className) }
                    onClick = { handleInsideClick }>
                    <FocusOn
                        returnFocus = {

                            // If we return the focus to an element outside the viewport the page will scroll to
                            // this element which in our case is undesirable and the element is outside of the
                            // viewport on purpose (to be hidden). For example if we return the focus to the toolbox
                            // when it is hidden the whole page will move up in order to show the toolbox. This is
                            // usually followed up with displaying the toolbox (because now it is on focus) but
                            // because of the animation the whole scenario looks like jumping large video.
                            isElementInTheViewport
                        }>
                        <div
                            aria-labelledby = { headingId ? `#${headingId}` : undefined }
                            aria-modal = { true }
                            data-autofocus = { true }
                            role = 'dialog'
                            tabIndex = { -1 }>
                            {children}
                        </div>
                    </FocusOn>
                </div>
            </div>
        ) : null
    );
}

export default Drawer;
