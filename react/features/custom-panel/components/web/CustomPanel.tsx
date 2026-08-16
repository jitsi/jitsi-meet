import { throttle } from 'lodash-es';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { isTouchDevice, shouldEnableResize } from '../../../base/environment/utils';
import { setCustomPanelIsResizing, setUserCustomPanelWidth } from '../../actions.web';
import {
    CUSTOM_PANEL_DRAG_HANDLE_HEIGHT,
    CUSTOM_PANEL_DRAG_HANDLE_OFFSET,
    CUSTOM_PANEL_DRAG_HANDLE_WIDTH,
    CUSTOM_PANEL_TOUCH_HANDLE_SIZE,
    DEFAULT_CUSTOM_PANEL_WIDTH
} from '../../constants';
import { getCustomPanelMaxSize, getCustomPanelOpen, isCustomPanelEnabled } from '../../functions';

import CustomPanelContent from './CustomPanelContent';

interface IStylesProps {

    /**
     * Whether the panel is currently being resized.
     */
    isResizing: boolean;

    /**
     * Whether the device supports touch.
     */
    isTouch: boolean;

    /**
     * Whether resize is enabled.
     */
    resizeEnabled: boolean;

    /**
     * The current width of the panel.
     */
    width: number;
}

const useStyles = makeStyles<IStylesProps>()((theme, { isResizing, isTouch, resizeEnabled, width }) => {
    return {
        container: {
            backgroundColor: theme.palette.ui01,
            flexShrink: 0,
            overflow: 'hidden',
            position: 'relative',
            transition: isResizing ? undefined : 'width .16s ease-in-out',
            width: `${width}px`,
            zIndex: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',

            // On non-touch devices (desktop), show handle on hover.
            // On touch devices, handle is always visible if resize is enabled.
            ...(!isTouch && {
                '&:hover, &:focus-within': {
                    '& .customPanelDragHandleContainer': {
                        visibility: 'visible'
                    }
                }
            }),

            '@media (max-width: 580px)': {
                height: '100dvh',
                position: 'fixed',
                left: 0,
                right: 0,
                top: 0,
                width: '100%',
                zIndex: 301
            }
        },

        contentContainer: {
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            width: '100%',
            height: '100%'
        },

        dragHandleContainer: {
            height: '100%',
            // Touch devices need larger hit target but positioned to not take extra space.
            width: isTouch ? `${CUSTOM_PANEL_TOUCH_HANDLE_SIZE}px` : `${CUSTOM_PANEL_DRAG_HANDLE_WIDTH}px`,
            backgroundColor: 'transparent',
            position: 'absolute',
            cursor: 'col-resize',
            display: resizeEnabled ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'center',
            // On touch devices, always visible if resize enabled. On desktop, hidden by default.
            visibility: (isTouch && resizeEnabled) ? 'visible' : 'hidden',
            // Position on LEFT edge of panel (custom panel is rightmost in layout).
            left: isTouch
                ? `${CUSTOM_PANEL_DRAG_HANDLE_OFFSET
                    - Math.floor((CUSTOM_PANEL_TOUCH_HANDLE_SIZE - CUSTOM_PANEL_DRAG_HANDLE_WIDTH) / 2)}px`
                : `${CUSTOM_PANEL_DRAG_HANDLE_OFFSET}px`,
            top: 0,
            zIndex: 2,
            // Prevent touch scrolling while dragging.
            touchAction: 'none',

            '&:hover': {
                '& .customPanelDragHandle': {
                    backgroundColor: theme.palette.icon01
                }
            },

            '&.visible': {
                visibility: 'visible',

                '& .customPanelDragHandle': {
                    backgroundColor: theme.palette.icon01
                }
            }
        },

        dragHandle: {
            // Keep the same visual appearance on all devices.
            backgroundColor: theme.palette.icon02,
            height: `${CUSTOM_PANEL_DRAG_HANDLE_HEIGHT}px`,
            width: `${CUSTOM_PANEL_DRAG_HANDLE_WIDTH / 3}px`,
            borderRadius: '1px',
            // Make more visible when actively shown on touch.
            ...(isTouch && resizeEnabled && {
                backgroundColor: theme.palette.icon01
            })
        }
    };
});

/**
 * Custom panel container component that handles resize, close button,
 * and renders CustomPanelContent inside it.
 *
 * @returns {JSX.Element | null} The custom panel or null if not open.
 */
export default function CustomPanel(): JSX.Element | null {
    const dispatch = useDispatch();
    const enabled = useSelector(isCustomPanelEnabled);
    const paneOpen = useSelector(getCustomPanelOpen);
    const panelWidth = useSelector((state: IReduxState) =>
        state['features/custom-panel']?.width?.current ?? DEFAULT_CUSTOM_PANEL_WIDTH);
    const isResizing = useSelector((state: IReduxState) =>
        state['features/custom-panel']?.isResizing ?? false);
    const maxPanelWidth = useSelector(getCustomPanelMaxSize);

    const isTouch = isTouchDevice();
    const resizeEnabled = shouldEnableResize();
    const { classes, cx } = useStyles({ isResizing, width: panelWidth, isTouch, resizeEnabled });

    const [ isMouseDown, setIsMouseDown ] = useState(false);
    const [ mousePosition, setMousePosition ] = useState<number | null>(null);
    const [ dragPanelWidth, setDragPanelWidth ] = useState<number | null>(null);

    /**
     * Handles pointer down on the drag handle.
     * Supports both mouse and touch events via Pointer Events API.
     *
     * @param {React.PointerEvent} e - The pointer down event.
     * @returns {void}
     */
    const onDragHandlePointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Capture the pointer to ensure we receive all pointer events
        // even if the pointer moves outside the element.
        (e.target as HTMLElement).setPointerCapture(e.pointerId);

        setIsMouseDown(true);
        setMousePosition(e.clientX);
        setDragPanelWidth(panelWidth);

        dispatch(setCustomPanelIsResizing(true));

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [ panelWidth, dispatch ]);

    /**
     * Handles pointer up to end drag resize.
     *
     * @returns {void}
     */
    const onDragPointerUp = useCallback(() => {
        if (isMouseDown) {
            setIsMouseDown(false);
            dispatch(setCustomPanelIsResizing(false));

            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    }, [ isMouseDown, dispatch ]);

    /**
     * Handles pointer move during drag resize.
     * Handle is on the LEFT edge, so dragging left (negative diff) widens the panel.
     *
     * @param {PointerEvent} e - The pointermove event.
     * @returns {void}
     */
    const onPanelResize = useCallback(throttle((e: PointerEvent) => {
        if (isMouseDown && mousePosition !== null && dragPanelWidth !== null) {
            const diff = e.clientX - mousePosition;

            // Handle is on LEFT edge: dragging left (negative diff) increases width.
            const newWidth = Math.max(
                Math.min(dragPanelWidth - diff, maxPanelWidth),
                DEFAULT_CUSTOM_PANEL_WIDTH
            );

            if (newWidth !== panelWidth) {
                dispatch(setUserCustomPanelWidth(newWidth));
            }
        }
    }, 50, {
        leading: true,
        trailing: false
    }), [ isMouseDown, mousePosition, dragPanelWidth, panelWidth, maxPanelWidth, dispatch ]);

    // Set up global event listeners for drag tracking.
    useEffect(() => {
        document.addEventListener('pointerup', onDragPointerUp);
        document.addEventListener('pointermove', onPanelResize);

        return () => {
            document.removeEventListener('pointerup', onDragPointerUp);
            document.removeEventListener('pointermove', onPanelResize);
        };
    }, [ onDragPointerUp, onPanelResize ]);

    if (!enabled || !paneOpen) {
        return null;
    }

    return (
        <div
            className = { classes.container }
            id = 'custom-panel'>
            <div
                className = { cx(
                    classes.dragHandleContainer,
                    (isMouseDown || isResizing) && 'visible',
                    'customPanelDragHandleContainer'
                ) }
                onPointerDown = { onDragHandlePointerDown }>
                <div className = { cx(classes.dragHandle, 'customPanelDragHandle') } />
            </div>
            <div className = { classes.contentContainer }>
                <CustomPanelContent />
            </div>
        </div>
    );
}
