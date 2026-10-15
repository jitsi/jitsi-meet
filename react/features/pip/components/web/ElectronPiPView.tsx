import React, { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import Icon from '../../../base/icons/components/Icon';
import { IconCloseLarge } from '../../../base/icons/svg';
import { exitPiP, handlePiPDoubleClick, setPiPDismissed } from '../../actions';
import logger from '../../logger';

import { PiPView } from './PiPView';

/**
 * Size of the dismiss button; matches the legacy always-on-top window.
 */
const DISMISS_BUTTON_SIZE = 32;

/**
 * Size of the X icon inside the dismiss button.
 */
const DISMISS_ICON_SIZE = 20;

const useStyles = makeStyles<void, 'dismiss'>()((theme, _params, classes) => {
    return {
        container: {
            height: '100%',
            position: 'relative',
            touchAction: 'none',
            width: '100%',

            [`&:hover .${classes.dismiss}`]: {
                opacity: 1
            }
        },

        // The legacy always-on-top dismiss button, a rounded square with an X
        // in the top right corner revealed while hovering the window, in the
        // theme's colors: the thumbnail background it floats over and the
        // toolbar's hover tone.
        dismiss: {
            alignItems: 'center',
            backgroundColor: theme.palette.thumbnailBackground,
            border: 0,
            borderRadius: `${theme.shape.borderRadius}px`,
            cursor: 'pointer',
            display: 'flex',
            height: `${DISMISS_BUTTON_SIZE}px`,
            justifyContent: 'center',
            opacity: 0,
            padding: 0,
            position: 'absolute',
            right: theme.spacing(2),
            top: theme.spacing(2),
            transition: 'opacity 0.3s ease',
            width: `${DISMISS_BUTTON_SIZE}px`,
            zIndex: 20,

            '&:hover': {
                backgroundColor: theme.palette.toolboxIconHover
            }
        }
    };
});

/**
 * State of an in-progress window drag.
 */
interface IDragState {
    /**
     * The pointer performing the drag.
     */
    pointerId: number;

    /**
     * The pointer-down offset within the window, subtracted from the global
     * screen coordinates on every move so the grabbed point stays under the
     * cursor (the legacy always-on-top drag math).
     */
    startOffset: { x: number; y: number; };
}

/**
 * Content of the custom Electron PiP window: the shared PiP view (video or
 * avatar, display name and controls) plus the legacy always-on-top window
 * interactions - drag anywhere to move, double click to return to the meeting
 * and an X button that dismisses PiP for the rest of the conference.
 *
 * The window is frameless, so dragging is implemented in JS. It relies only on
 * web platform APIs: the popup was opened by this page, so it may be moved with
 * window.moveTo(). CSS app-region dragging is deliberately avoided (like the
 * legacy implementation did) because it swallows all mouse events, which would
 * break the double click and the controls.
 *
 * @returns {React.ReactElement}
 */
export function ElectronPiPView() {
    const { classes, theme } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const pipWindow = useSelector((state: IReduxState) => state['features/pip'].pipWindow);
    const dragRef = useRef<IDragState | null>(null);

    const onDoubleClick = useCallback(() => {
        logger.info('PiP window double clicked');
        dispatch(handlePiPDoubleClick());
    }, [ dispatch ]);

    const onDismiss = useCallback((event: React.MouseEvent) => {
        event.stopPropagation();
        logger.info('PiP window dismissed for the rest of the conference');
        dispatch(setPiPDismissed(true));
        dispatch(exitPiP('dismissed'));
    }, [ dispatch ]);

    const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        // Do not hijack interactions with the controls (toolbar buttons, the
        // dismiss button) and only drag with the primary button.
        if (event.button !== 0 || !pipWindow
                || (event.target as HTMLElement).closest('button, .toolbox-button')) {
            return;
        }

        dragRef.current = {
            pointerId: event.pointerId,
            startOffset: {
                x: event.clientX,
                y: event.clientY
            }
        };

        // Keep receiving the pointer even when a fast drag momentarily leaves
        // the (moving) window.
        event.currentTarget.setPointerCapture(event.pointerId);
    }, [ pipWindow ]);

    const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;

        if (!drag || drag.pointerId !== event.pointerId || !pipWindow) {
            return;
        }

        pipWindow.moveTo(event.screenX - drag.startOffset.x, event.screenY - drag.startOffset.y);
    }, [ pipWindow ]);

    const endDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (dragRef.current?.pointerId !== event.pointerId) {
            return;
        }

        dragRef.current = null;

        try {
            event.currentTarget.releasePointerCapture(event.pointerId);
        } catch (error) {
            // The capture may already be gone (e.g. the pointer was cancelled).
        }
    }, []);

    return (
        <div
            className = { classes.container }
            onDoubleClick = { onDoubleClick }
            onPointerCancel = { endDrag }
            onPointerDown = { onPointerDown }
            onPointerMove = { onPointerMove }
            onPointerUp = { endDrag }>
            <PiPView />
            <button
                aria-label = { t('dialog.close') }
                className = { classes.dismiss }
                onClick = { onDismiss }>
                <Icon
                    color = { theme.palette.icon01 }
                    size = { DISMISS_ICON_SIZE }
                    src = { IconCloseLarge } />
            </button>
        </div>
    );
}
