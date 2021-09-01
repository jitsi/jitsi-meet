
// @flow

import Konva from 'konva';
import React, { useEffect, useRef, useState } from 'react';

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
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

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
function ResizeAndDrag({ _currentCameraDeviceId, dispatch, updateTransparent }: Props) {
    const [ containerWidth ] = useState(DESKTOP_SHARE_DIMENSIONS.CONTAINER_WIDTH);
    const [ containerHeight ] = useState(DESKTOP_SHARE_DIMENSIONS.CONTAINER_HEIGHT);
    const dragAndResizeRef = useRef(null);
    const createLocalJitsiTrack = async () => {
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
        if (dragAndResizeRef.current && jitsiTrack) {
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
            const url = await createLocalTrack('desktop', '');

            desktopVideo.srcObject = await url.stream;

            const video = document.createElement('video');

            video.srcObject = await jitsiTrack.stream;

            const image = new Konva.Image({
                image: video,
                draggable: true,
                x: stage.width() - DESKTOP_SHARE_DIMENSIONS.RECTANGLE_WIDTH,
                y: stage.height() - DESKTOP_SHARE_DIMENSIONS.RECTANGLE_HEIGHT
            });

            const desktopImage = new Konva.Image({
                image: desktopVideo,
                x: stage.width() / 2,
                y: (stage.height() / 2) - (containerHeight / 2),
                scaleX: 0.5,
                scaleY: 0.5
            });

            layer.add(desktopImage);

            desktopVideo.onresize = () => {
                desktopImage.width(desktopVideo.videoWidth);
                desktopImage.height(desktopVideo.videoHeight + (containerHeight / 2));
                const desktopImageDimensions = desktopImage.getClientRect({ skipTransform: false });

                stage.height(desktopImageDimensions.height);

                // We need to scale the person image on desktop video resize.
                const scale = desktopImageDimensions.width / dragAndResizeRef.current.offsetWidth;

                image.scale({
                    x: scale,
                    y: scale
                });
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
                node: image
            });

            // Enable specific anchors.
            personTr.enabledAnchors([ 'top-left', 'top-right', 'bottom-left', 'bottom-right' ]);

            // Disable rotation.
            personTr.rotateEnabled(false);
            layer.add(personTr);
            personTr.nodes([ image ]);

            image.on('transformstart', () => {
                updateTransformValues();
            });

            image.on('dragmove', () => {
                updateTransformValues();
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
                image.width(DESKTOP_SHARE_DIMENSIONS.RECTANGLE_WIDTH);
                image.height(DESKTOP_SHARE_DIMENSIONS.RECTANGLE_HEIGHT);
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

            /**
            * This function updates human and desktop videos size values after resizing or repositioning actions.
            *
            * @returns {void}
            */
            function updateTransformValues() {
                const dimensions = {
                    x: image.x() + dragAndResizeRef.current.getBoundingClientRect().left,
                    y: image.y() + dragAndResizeRef.current.getBoundingClientRect().top,
                    width: Math.max(5, image.width() * image.scaleX()),
                    height: Math.max(5, image.height() * image.scaleY()),
                    scaleX: image.scaleX(),
                    scaleY: image.scaleY(),
                    url
                };

                updateTransparent(dimensions);
            }
        }
    };

    useEffect(() => {
        if (dragAndResizeRef.current) {
            createLocalJitsiTrack();
        }
    }, [ dragAndResizeRef ]);

    return (<div
        className = 'drag-and-resize-area video-preview'
        ref = { dragAndResizeRef } />);
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code VirtualBackgroundPreview} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{Props}}
 */
function _mapStateToProps(state): Object {
    return {
        _currentCameraDeviceId: getCurrentCameraDeviceId(state)
    };
}

export default connect(_mapStateToProps)(ResizeAndDrag);
