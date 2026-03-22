import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { translate } from '../../base/i18n/functions';
import Dialog from '../../base/ui/components/web/Dialog';
import { cropAndResizeImage } from '../functions';

/**
 * Styles for the VirtualBackgroundFramingDialog.
 * Includes positioning for the viewfinder and aesthetics for the resize handles.
 */
const useStyles = makeStyles()(theme => {
    return {
        container: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            padding: theme.spacing(2),
            boxSizing: 'border-box'
        },

        imageWrapper: {
            position: 'relative',
            width: '100%',
            maxHeight: '60vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#1a1a1a',
            borderRadius: '4px',
            overflow: 'hidden'
        },

        image: {
            maxHeight: '100%',
            maxWidth: '100%',
            userSelect: 'none',
            pointerEvents: 'none'
        },

        viewfinder: {
            position: 'absolute',
            border: `2px solid ${theme.palette.action01Hover}`,
            boxSizing: 'border-box',
            boxShadow: '0 0 0 1000px rgba(0, 0, 0, 0.6)',
            cursor: 'move',
            zIndex: 2
        },

        handle: {
            position: 'absolute',
            width: '10px',
            height: '10px',
            background: theme.palette.action01Hover,
            border: `1px solid ${theme.palette.ui01}`,
            boxShadow: '0 0 4px rgba(0, 0, 0, 0.5)',
            zIndex: 3,

            '&.nw': { top: '-5px', left: '-5px', cursor: 'nwse-resize' },
            '&.se': { bottom: '-5px', right: '-5px', cursor: 'nwse-resize' }
        },

        hint: {
            ...theme.typography.bodyShort,
            color: theme.palette.text01,
            marginTop: theme.spacing(2),
            textAlign: 'center'
        }
    };
});

interface IProps {
    image: string;
    onSuccess: (dataURL: string) => void;
    onClose: () => void;
    ratio: number;
    targetWidth?: number;
    targetHeight?: number;
}

const MIN_SIZE = 100; // Minimum allowed crop size in pixels.

const TARGET_RATIO = 16 / 9; // Unused, keeping as fallback if needed

/**
 * Interactive framing dialog that allows users to select a specific region of an uploaded image.
 * It maintains a fixed aspect ratio matching the user's camera and supports:
 * 1. Dragging the viewfinder to move the crop area.
 * 2. Dragging corner handles to resize the crop area.
 * 3. Proportional scaling for the final output.
 *
 * @returns {ReactElement}
 */
function VirtualBackgroundFramingDialog({ image, onSuccess, onClose, ratio }: IProps) {
    const { classes, cx } = useStyles();
    const { t } = useTranslation();
    const [ imgDimensions, setImgDimensions ] = useState({ width: 0, height: 0 });
    const [ displayDimensions, setDisplayDimensions ] = useState({ width: 0, height: 0, left: 0, top: 0 });
    const [ crop, setCrop ] = useState({ x: 0, y: 0, w: 0, h: 0 });
    const [ interaction, setInteraction ] = useState<{ mode: 'none' | 'dragging' | 'resizing', handle?: string, startX: number, startY: number, startCrop: typeof crop }>({
        mode: 'none',
        startX: 0,
        startY: 0,
        startCrop: { x: 0, y: 0, w: 0, h: 0 }
    });
    
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const img = new Image();

        img.onload = () => {
            setImgDimensions({ width: img.width, height: img.height });
        };
        img.src = image;
    }, [ image ]);

    /**
     * Global listener to stop dragging/resizing if the mouse is released outside the dialog.
     */
    useEffect(() => {
        const stop = () => setInteraction(prev => ({ ...prev, mode: 'none' }));

        window.addEventListener('mouseup', stop);

        return () => window.removeEventListener('mouseup', stop);
    }, []);

    useEffect(() => {
        if (imgRef.current && imgDimensions.width > 0) {
            const { offsetWidth, offsetHeight, offsetLeft, offsetTop } = imgRef.current;

            setDisplayDimensions({ width: offsetWidth, height: offsetHeight, left: offsetLeft, top: offsetTop });

            let w, h;

            if ((offsetWidth / offsetHeight) > ratio) {
                h = offsetHeight;
                w = h * ratio;
            } else {
                w = offsetWidth;
                h = w / ratio;
            }

            setCrop({
                x: offsetLeft + (offsetWidth - w) / 2,
                y: offsetTop + (offsetHeight - h) / 2,
                w,
                h
            });
        }
    }, [ imgDimensions ]);

    const startInteraction = (e: React.MouseEvent, mode: 'dragging' | 'resizing', handle?: string) => {
        e.stopPropagation();
        setInteraction({
            mode,
            handle,
            startX: e.clientX,
            startY: e.clientY,
            startCrop: { ...crop }
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (interaction.mode === 'none') {
            return;
        }

        const dx = e.clientX - interaction.startX;
        const dy = e.clientY - interaction.startY;
        const { startCrop } = interaction;

        if (interaction.mode === 'dragging') {
            let newX = startCrop.x + dx;
            let newY = startCrop.y + dy;

            newX = Math.max(displayDimensions.left, Math.min(newX, displayDimensions.left + displayDimensions.width - crop.w));
            newY = Math.max(displayDimensions.top, Math.min(newY, displayDimensions.top + displayDimensions.height - crop.h));

            setCrop(prev => ({ ...prev, x: newX, y: newY }));
        } else if (interaction.mode === 'resizing') {
            let newW = startCrop.w;
            let newX = startCrop.x;
            let newY = startCrop.y;

            if (interaction.handle === 'se') {
                newW = Math.max(MIN_SIZE, startCrop.w + dx);
                newW = Math.min(newW, displayDimensions.left + displayDimensions.width - startCrop.x);
                newW = Math.min(newW, (displayDimensions.top + displayDimensions.height - startCrop.y) * ratio);
            } else if (interaction.handle === 'sw') {
                newW = Math.max(MIN_SIZE, startCrop.w - dx);
                newW = Math.min(newW, startCrop.x + startCrop.w - displayDimensions.left);
                newW = Math.min(newW, (displayDimensions.top + displayDimensions.height - startCrop.y) * ratio);
                newX = startCrop.x + startCrop.w - newW;
            } else if (interaction.handle === 'ne') {
                newW = Math.max(MIN_SIZE, startCrop.w + dx);
                newW = Math.min(newW, displayDimensions.left + displayDimensions.width - startCrop.x);
                newW = Math.min(newW, (startCrop.y + startCrop.h - displayDimensions.top) * ratio);
                newY = startCrop.y + startCrop.h - (newW / ratio);
            } else if (interaction.handle === 'nw') {
                newW = Math.max(MIN_SIZE, startCrop.w - dx);
                newW = Math.min(newW, startCrop.x + startCrop.w - displayDimensions.left);
                newW = Math.min(newW, (startCrop.y + startCrop.h - displayDimensions.top) * ratio);
                newX = startCrop.x + startCrop.w - newW;
                newY = startCrop.y + startCrop.h - (newW / ratio);
            }

            setCrop(prev => ({
                x: newX,
                y: newY,
                w: newW,
                h: newW / ratio
            }));
        }
    };

    const stopInteraction = () => {
        setInteraction(prev => ({ ...prev, mode: 'none' }));
    };

    /**
     * Calculates the final crop coordinates in original image space and generates the background.
     */
    const onSave = useCallback(async () => {
        // Calculate the scale between the displayed image and the original source image.
        const scale = imgDimensions.width / displayDimensions.width;

        // Convert crop rectangle from displayed image coordinates
        // to original image coordinates using the scale factor.
        // This ensures we crop the correct region from the full resolution image.
        const sx = (crop.x - displayDimensions.left) * scale;
        const sy = (crop.y - displayDimensions.top) * scale;

        // sWidth and sHeight are the dimensions of the crop in the original image.
        const sWidth = crop.w * scale;
        const sHeight = crop.h * scale;

        // Output resolution for the final background.
        // We prefer matching the user's native camera resolution for optimal performance.
        const finalWidth = targetWidth || 1920;
        const finalHeight = targetHeight || Math.round(finalWidth / ratio);

        // Generate the final background image using our cropping utility.
        const croppedUrl = await cropAndResizeImage(image, finalWidth, finalHeight, sx, sy, sWidth, sHeight);

        if (croppedUrl) {
            onSuccess(croppedUrl);
        }
    }, [ image, imgDimensions, displayDimensions, crop, onSuccess, ratio, targetWidth, targetHeight ]);

    return (
        <Dialog
            onCancel = { onClose }
            onSubmit = { onSave }
            size = 'large'
            titleKey = 'virtualBackground.addBackground' >
            <div
                className = { classes.container }
                onMouseMove = { handleMouseMove }
                onMouseLeave = { stopInteraction }
                onMouseUp = { stopInteraction }>
                <div className = { classes.imageWrapper }>
                    <img
                        alt = 'Framing preview'
                        className = { classes.image }
                        ref = { imgRef }
                        src = { image } />
                    <div
                        className = { classes.viewfinder }
                        onMouseDown = { e => startInteraction(e, 'dragging') }
                        style = {{
                            left: crop.x,
                            top: crop.y,
                            width: crop.w,
                            height: crop.h
                        }}>
                        <div className = { cx(classes.handle, 'nw') } onMouseDown = { e => startInteraction(e, 'resizing', 'nw') } />
                        <div className = { cx(classes.handle, 'se') } onMouseDown = { e => startInteraction(e, 'resizing', 'se') } />
                    </div>
                </div>
                <p className = { classes.hint }>
                    {t('virtualBackground.framingHint', 'Drag the rectangle to move, or the corners to resize.')}
                </p>
            </div>
        </Dialog>
    );
}

export default translate(VirtualBackgroundFramingDialog);
