// @flow

import Spinner from '@atlaskit/spinner';
import Konva from 'konva';
import React, { useEffect, useRef, useState } from 'react';

import { hideDialog } from '../../base/dialog';
import { JitsiTrackErrors } from '../../base/lib-jitsi-meet';
import { createLocalTrack } from '../../base/lib-jitsi-meet/functions';
import { connect } from '../../base/redux';
import { getCurrentCameraDeviceId } from '../../base/settings';
import { createLocalTracksF } from '../../base/tracks/functions';
import { toggleBackgroundEffect } from '../actions';
import { VIRTUAL_BACKGROUND_TYPE, DESKTOP_SHARE_DIMENSIONS } from '../constants';

type Props = {

    /**
     * The deviceId of the camera device currently being used.
     */
    _currentCameraDeviceId: string,

    /**
     * Returns the selected virtual background object.
     */
    _virtualBackground: Object,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * Callback function for virtual background dialog.
     */
    screen: Object,

    /**
     * Callback function for virtual background dialog.
     */
    updateTransparent: Function
};

/**
 * Renders resize and drag element.
 *
 * @returns {ReactElement}
 */
function ResizeAndDrag({ _currentCameraDeviceId, _virtualBackground, dispatch, screen, updateTransparent }: Props) {

    // Define several math function.

    /**
     * Get client rect.
     *
     * @param {Object} rotatedBox - Object that contains dimensions positions and rotation of resizable element.
     * @returns {void}
     */
    function getClientRect(rotatedBox) {
        const { x, y, width, height } = rotatedBox;
        const rad = rotatedBox.rotation;

        const p1 = getCorner(x, y, 0, 0, rad);
        const p2 = getCorner(x, y, width, 0, rad);
        const p3 = getCorner(x, y, width, height, rad);
        const p4 = getCorner(x, y, 0, height, rad);

        const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
        const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
        const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
        const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    /**
     * Get Corner.
     *
     * @param {number} pivotX - The min x position.
     * @param {number} pivotY - The min y position.
     * @param {number} diffX - The box width.
     * @param {number} diffY - The box height.
     * @param {number} angle - Rotation details.
     * @returns {void}
     */
    function getCorner(pivotX, pivotY, diffX, diffY, angle) { // eslint-disable-line max-params
        const distance = Math.sqrt((diffX * diffX) + (diffY * diffY));

        // Find angle from pivot to corner.
        // eslint-disable-next-line no-param-reassign
        angle += Math.atan2(diffY, diffX);

        // Get new x and y and round it off to integer.
        const x = pivotX + (distance * Math.cos(angle));
        const y = pivotY + (distance * Math.sin(angle));

        return {
            x,
            y
        };
    }

    /**
     * Get total boxes on drag action.
     *
     * @param {Object} boxes - Object that contains dimensions and positions of draggable element.
     * @returns {void}
     */
    function getTotalBox(boxes) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        boxes.forEach(box => {
            minX = Math.min(minX, box.x);
            minY = Math.min(minY, box.y);
            maxX = Math.max(maxX, box.x + box.width);
            maxY = Math.max(maxY, box.y + box.height);
        });

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    const dragAndResizeRef = useRef(null);
    const [ desktopShareType ]
    = useState((_virtualBackground.backgroundType === VIRTUAL_BACKGROUND_TYPE.TRANSPARENT_PREVIEW)
    || (_virtualBackground.backgroundType === VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE_TRANSFORM));
    const [ containerWidth ] = useState(DESKTOP_SHARE_DIMENSIONS.CONTAINER_WIDTH);
    const [ containerHeight ] = useState(DESKTOP_SHARE_DIMENSIONS.CONTAINER_HEIGHT);
    const [ loader, setLoader ] = useState(false);

    /**
     * Apply video preview loader.
     *
     * @returns {void}
     */
    const loadVideoPreview = () =>
        (
            <div className = 'video-preview-loader'>
                <Spinner
                    invertColor = { true }
                    isCompleting = { false }
                    size = { 'large' } />
            </div>
        );

    const createLocalJitsiTrack = async sharingObject => {

        setLoader(true);

        const [ jitsiTrack ] = await createLocalTracksF({
            cameraDeviceId: _currentCameraDeviceId,
            devices: [ 'video' ]
        });
        const transparentOptions = {
            backgroundType: VIRTUAL_BACKGROUND_TYPE.TRANSPARENT_PREVIEW,
            enabled: true,
            selectedThumbnail: 'transparent-preview'
        };

        await dispatch(toggleBackgroundEffect(transparentOptions, jitsiTrack));

        setLoader(false);

        if (dragAndResizeRef?.current && jitsiTrack) {
            const stage = new Konva.Stage({
                container: dragAndResizeRef.current,
                width: containerWidth,
                height: containerHeight,
                scale: {
                    x: 0.5,
                    y: 0.5
                }
            });

            const layer = new Konva.Layer();

            stage.add(layer);
            const desktopVideo = document.createElement('video');
            let url;

            /* eslint-disable max-depth */
            if (desktopShareType && sharingObject === null) {
                url = await _virtualBackground?.virtualSource;
            } else {
                try {
                    url = await createLocalTrack('desktop', '');
                } catch (e) {
                    if (e.name === JitsiTrackErrors.SCREENSHARING_USER_CANCELED) {
                        url = await sharingObject?.virtualSource ?? sharingObject?.url;
                        if (!url) {
                            const noneOptions = {
                                enabled: false,
                                selectedThumbnail: 'none'
                            };

                            await dispatch(toggleBackgroundEffect(noneOptions, jitsiTrack));
                            dispatch(hideDialog());

                            return;
                        }
                    }
                }
            }

            desktopVideo.srcObject = url?.stream;

            const video = document.createElement('video');

            video.srcObject = await jitsiTrack.stream;

            const desktopImage = new Konva.Image({
                image: desktopVideo,
                scaleX: 0.5,
                scaleY: 0.5
            });

            const image = new Konva.Image({
                image: video,
                draggable: true,
                x: _virtualBackground?.dragAndDropOptions?.previewX ?? 0,
                y: _virtualBackground?.dragAndDropOptions?.previewY ?? 0
            });

            layer.add(desktopImage);

            desktopVideo.onresize = () => {
                desktopImage.width(desktopVideo.videoWidth);
                desktopImage.height(desktopVideo.videoHeight + (containerHeight / 2));

                const desktopImageDimensions = desktopImage.getClientRect({ skipTransform: false });

                stage.height(desktopImageDimensions.height);
                stage.width(desktopImageDimensions.width);

                // $FlowExpectedError
                dragAndResizeRef.current.style.width = `${desktopImageDimensions.width}px`;
                const virtualBackgroundPreview = document.querySelector('.virtual-background-preview-dnd');

                // $FlowExpectedError
                virtualBackgroundPreview.style.height = `${desktopImageDimensions.height}px`;

                // $FlowExpectedError
                virtualBackgroundPreview.style.width = `${desktopImageDimensions.width}px`;

                // Be sure that sizes of human video are updated after desktop video resize.
                updateTransformValues(image, url, jitsiTrack);
            };

            desktopVideo.addEventListener('loadedmetadata', () => {
                desktopVideo.play();

                /**
                 * Method takes a callback as an argument to be invoked before the repaint.
                 *
                 * @returns {void}
                 */
                function step() {
                    layer.draw();
                    window.requestAnimationFrame(step);
                }
                window.requestAnimationFrame(step);
            });

            // Create new transformer.
            const desktopTr = new Konva.Transformer({
                node: desktopImage
            });

            // Enable specific anchors.
            desktopTr.enabledAnchors([]);

            // Disable rotation.
            desktopTr.rotateEnabled(false);
            layer.add(desktopTr);
            desktopTr.nodes([ desktopImage ]);

            // Create new transformer
            const personTr = new Konva.Transformer({
                node: image,
                boundBoxFunc: (oldBox, newBox) => {
                    const box = getClientRect(newBox);
                    const isOut = box.x < 0 || box.y < 0 || box.x + box.width > stage.width()
                    || box.y + box.height > stage.height();

                    // If new bounding box is out of visible viewport, let's just skip transforming
                    // this logic can be improved by still allow some transforming if we have small available space.
                    if (isOut) {
                        return oldBox;
                    }

                    return newBox;
                }
            });

            personTr.on('dragmove', () => {
                const boxes = personTr.nodes().map(node => node.getClientRect());
                const box = getTotalBox(boxes);

                personTr.nodes().forEach(shape => {
                    const absPos = shape.getAbsolutePosition();

                    // Where are shapes inside bounding box of all shapes?
                    const offsetX = box.x - absPos.x;

                    const offsetY = box.y - absPos.y;

                    // We total box goes outside of viewport, we need to move absolute position of shape.
                    const newAbsPos = { ...absPos };

                    if (box.x < 0) {
                        newAbsPos.x = -offsetX;
                    }
                    if (box.y < 0) {
                        newAbsPos.y = -offsetY;
                    }
                    if (box.x + box.width > stage.width()) {
                        newAbsPos.x = stage.width() - box.width - offsetX;
                    }
                    if (box.y + box.height > stage.height()) {
                        newAbsPos.y = stage.height() - box.height - offsetY;
                    }
                    shape.setAbsolutePosition(newAbsPos);
                });
            });

            // Enable specific anchors.
            personTr.enabledAnchors([ 'top-left', 'top-right', 'bottom-left', 'bottom-right' ]);

            // Disable rotation.
            personTr.rotateEnabled(false);
            layer.add(personTr);
            personTr.nodes([ image ]);
            image.on('transformend', () => {
                updateTransformValues(image, url, jitsiTrack);
            });

            image.on('dragend', () => {
                updateTransformValues(image, url, jitsiTrack);
            });

            // Change cursor style on drag action.
            image.on('mouseenter', () => {
                stage.container().style.cursor = 'move';
            });

            // Return to default cursor style after drag action.
            image.on('mouseleave', () => {
                stage.container().style.cursor = 'default';
            });

            layer.add(image);
            video.addEventListener('loadedmetadata', () => {
                image.width(_virtualBackground?.dragAndDropOptions?.previewWidth
                    ?? DESKTOP_SHARE_DIMENSIONS.RECTANGLE_WIDTH);
                image.height(_virtualBackground?.dragAndDropOptions?.previewHeight
                    ?? DESKTOP_SHARE_DIMENSIONS.RECTANGLE_HEIGHT);
                video.play();

                /**
                 * Method takes a callback as an argument to be invoked before the repaint.
                 *
                 * @returns {void}
                 */
                function step() {
                    layer.draw();
                    window.requestAnimationFrame(step);
                }
                window.requestAnimationFrame(step);
            });
        }

        /**
        * This function updates human and desktop videos size values after resizing or repositioning actions.
        *
        * @param {HTMLCanvasElement} image  - Person image.
        * @param {Object} url - Local video track.
        * @param {Object} track - Local desktop track.
        * @returns {void}
        */
        function updateTransformValues(image, url, track) {
            const personImageCoordonates = image.getClientRect({ skipTransform: false });

            const virtualBackgroundPreview

            // $FlowExpectedError
            = document.querySelector('.virtual-background-preview-dnd').getBoundingClientRect();
            const dragAndDropOptions = {
                x: (personImageCoordonates.x - 0) / virtualBackgroundPreview.width,
                y: (personImageCoordonates.y - 0) / virtualBackgroundPreview.height,
                bkgWidth: virtualBackgroundPreview.width,
                bkgHeight: virtualBackgroundPreview.height,
                width: personImageCoordonates.width,
                height: personImageCoordonates.height,
                url,
                jitsiTrack: track,
                previewX: image.x(),
                previewY: image.y(),
                previewWidth: Math.max(5, image.width() * image.scaleX()),
                previewHeight: Math.max(5, image.height() * image.scaleY())
            };

            updateTransparent(dragAndDropOptions);
        }
    };

    useEffect(() => {
        dragAndResizeRef.current = true;
        if (dragAndResizeRef.current) {
            createLocalJitsiTrack(null);
        }

        if (screen !== null && dragAndResizeRef.current) {
            createLocalJitsiTrack(screen);
        }

        return () => {
            dragAndResizeRef.current = false;
        };

    }, [ screen ]);

    return (
        <>
            { loader
                ? <div className = 'video-preview-loader'>{ loadVideoPreview() }</div>
                : <div
                    className = 'drag-and-resize-area video-preview'
                    ref = { dragAndResizeRef } />}
        </>
    );
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code ResizeAndDrag} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{Props}}
 */
function _mapStateToProps(state): Object {
    return {
        _currentCameraDeviceId: getCurrentCameraDeviceId(state),
        _virtualBackground: state['features/virtual-background']
    };
}

export default connect(_mapStateToProps)(ResizeAndDrag);
