import { throttle } from 'lodash-es';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AnyAction } from 'redux';

/**
 * The interval, in milliseconds, at which pointer moves are handled while dragging.
 */
const RESIZE_THROTTLE_MS = 50;

interface IPanelResizeOptions {

    /**
     * The edge of the panel the drag handle is attached to. A handle on the right edge
     * widens the panel when dragged right, one on the left edge when dragged left.
     */
    edge: 'left' | 'right';

    /**
     * The maximum width the panel may be resized to.
     */
    maxWidth: number;

    /**
     * The minimum width the panel may be resized to.
     */
    minWidth: number;

    /**
     * Action creator for flagging that a resize is in progress.
     */
    setIsResizing: (isResizing: boolean) => AnyAction;

    /**
     * Action creator for storing the width picked by the user.
     */
    setWidth: (width: number) => AnyAction;

    /**
     * The current width of the panel.
     */
    width: number;
}

interface IPanelResize {

    /**
     * Whether the drag handle is currently held down.
     */
    isMouseDown: boolean;

    /**
     * Pointer down handler to attach to the drag handle.
     */
    onDragHandlePointerDown: (e: React.PointerEvent) => void;
}

/**
 * Hook providing drag-to-resize behavior for a side panel. It tracks the pointer on
 * the document so the drag survives the pointer leaving the handle, and clamps the
 * resulting width between {@code minWidth} and {@code maxWidth}.
 *
 * @param {IPanelResizeOptions} options - The panel specific resize options.
 * @returns {IPanelResize}
 */
export default function usePanelResize({
    edge,
    maxWidth,
    minWidth,
    setIsResizing,
    setWidth,
    width
}: IPanelResizeOptions): IPanelResize {
    const dispatch = useDispatch();
    const [ isMouseDown, setIsMouseDown ] = useState(false);
    const [ mousePosition, setMousePosition ] = useState<number | null>(null);
    const [ dragWidth, setDragWidth ] = useState<number | null>(null);

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

        // Store the initial pointer position and panel width.
        setIsMouseDown(true);
        setMousePosition(e.clientX);
        setDragWidth(width);

        dispatch(setIsResizing(true));

        // Add visual feedback that we're dragging (cursor for mouse, not visible on touch)
        // and disable text selection during resize.
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [ width, setIsResizing, dispatch ]);

    /**
     * Handles pointer up to end drag resize.
     *
     * @returns {void}
     */
    const onDragPointerUp = useCallback(() => {
        if (isMouseDown) {
            setIsMouseDown(false);
            dispatch(setIsResizing(false));

            // Restore cursor and text selection.
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    }, [ isMouseDown, setIsResizing, dispatch ]);

    /**
     * Handles pointer move during drag resize.
     *
     * @param {PointerEvent} e - The pointermove event.
     * @returns {void}
     */
    const onPointerMove = useCallback(throttle((e: PointerEvent) => {
        if (isMouseDown && mousePosition !== null && dragWidth !== null) {
            const diff = e.clientX - mousePosition;
            const draggedWidth = edge === 'right' ? dragWidth + diff : dragWidth - diff;
            const newWidth = Math.max(Math.min(draggedWidth, maxWidth), minWidth);

            // Update the width only if it has changed.
            if (newWidth !== width) {
                dispatch(setWidth(newWidth));
            }
        }
    }, RESIZE_THROTTLE_MS, {
        leading: true,
        trailing: false
    }), [ isMouseDown, mousePosition, dragWidth, width, maxWidth, minWidth, edge, setWidth, dispatch ]);

    // Set up global event listeners for drag tracking.
    useEffect(() => {
        document.addEventListener('pointerup', onDragPointerUp);
        document.addEventListener('pointermove', onPointerMove);

        return () => {
            document.removeEventListener('pointerup', onDragPointerUp);
            document.removeEventListener('pointermove', onPointerMove);
        };
    }, [ onDragPointerUp, onPointerMove ]);

    return {
        isMouseDown,
        onDragHandlePointerDown
    };
}
