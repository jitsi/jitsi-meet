// @flow
/* eslint-disable react/jsx-no-bind, no-return-assign */
import React, { useState, useEffect } from 'react';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { Icon, IconBlurBackground, IconTrash } from '../../base/icons';
import { connect } from '../../base/redux';
import { Tooltip } from '../../base/tooltip';
import { toggleBackgroundEffect, setVirtualBackground } from '../actions';

const images = [
    {
        tooltip: 'Image 1',
        name: 'background-1.jpg',
        id: 1,
        src: 'images/virtual-background/background-1.jpg'
    },
    {
        tooltip: 'Image 2',
        name: 'background-2.jpg',
        id: 2,
        src: 'images/virtual-background/background-2.jpg'
    },
    {
        tooltip: 'Image 3',
        name: 'background-3.jpg',
        id: 3,
        src: 'images/virtual-background/background-3.jpg'
    },
    {
        tooltip: 'Image 4',
        name: 'background-4.jpg',
        id: 4,
        src: 'images/virtual-background/background-4.jpg'
    }
];
type Props = {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Renders virtual background dialog.
 *
 * @returns {ReactElement}
 */
function VirtualBackground({ dispatch, t }: Props) {
    const [ storedImages, setStoredImages ] = useState(JSON.parse(localStorage.getItem('storedImages') || '{}') || []);

    /**
     * Updates stored images on local storage.
     */
    useEffect(() => {
        localStorage.setItem('storedImages', JSON.stringify(storedImages));
    }, [ storedImages ]);

    const [ selected, setSelected ] = useState('');
    const enableBlur = () => {
        setSelected('blur');
        dispatch(setVirtualBackground('', false));
        dispatch(toggleBackgroundEffect(true));
    };

    const removeBackground = () => {
        setSelected('none');
        dispatch(setVirtualBackground('', false));
        dispatch(toggleBackgroundEffect(false));
    };

    const addImageBackground = image => {
        setSelected(image.id);
        dispatch(setVirtualBackground(image.src, true));
        dispatch(toggleBackgroundEffect(true));
    };

    const deleteStoredImage = image => {
        setStoredImages(storedImages.filter(item => item !== image));
    };

    const uploadImage = imageFile => {
        const reader = new FileReader();

        reader.readAsDataURL(imageFile[0]);
        reader.onload = () => {
            setStoredImages([
                ...storedImages,
                {
                    tooltip: imageFile[0].name,
                    name: imageFile[0].name,
                    id: Math.random()
                        .toString(36)
                        .substring(2, 7),
                    src: reader.result.toString()
                }
            ]);

            dispatch(setVirtualBackground(reader.result.toString(), true));
            dispatch(toggleBackgroundEffect(true));
        };
        reader.onerror = () => {
            throw new Error('Failed to upload virtual image!');
        };
    };

    return (
        <Dialog
            hideCancelButton = { true }
            submitDisabled = { false }
            titleKey = { 'virtualBackground.title' }
            width = 'small'>
            <div className = 'virtual-background-dialog'>
                <Tooltip
                    content = { t('virtualBackground.removeBackground') }
                    position = { 'top' }>
                    <div
                        className = { selected === 'none' ? 'none-selected' : 'virtual-background-none' }
                        onClick = { () => removeBackground() }>
                        None
                    </div>
                </Tooltip>
                <Tooltip
                    content = { t('virtualBackground.enableBlur') }
                    position = { 'top' }>
                    <Icon
                        className = { selected === 'blur' ? 'blur-selected' : '' }
                        onClick = { () => enableBlur() }
                        size = { 50 }
                        src = { IconBlurBackground } />
                </Tooltip>
                {images.map((image, index) => (
                    <Tooltip
                        content = { image.tooltip }
                        key = { index }
                        position = { 'top' }>
                        <img
                            className = { selected === image.id ? 'thumbnail-selected' : 'thumbnail' }
                            onClick = { () => addImageBackground(image) }
                            onError = { event => event.target.style.display = 'none' }
                            src = { image.src } />
                    </Tooltip>
                ))}
                <Tooltip
                    content = { t('virtualBackground.uploadImage') }
                    position = { 'top' }>
                    <label
                        className = 'custom-file-upload'
                        htmlFor = 'file-upload'>
                        +
                    </label>
                    <input
                        accept = 'image/*'
                        className = 'file-upload-btn'
                        id = 'file-upload'
                        onChange = { e => uploadImage(e.target.files) }
                        type = 'file' />
                </Tooltip>
            </div>

            <div className = 'virtual-background-dialog'>
                {storedImages.map((image, index) => (
                    <Tooltip
                        content = { image.tooltip }
                        key = { index }
                        position = { 'top' }>
                        <img
                            className = { selected === image.id ? 'thumbnail-selected' : 'thumbnail' }
                            onClick = { () => addImageBackground(image) }
                            onError = { event => event.target.style.display = 'none' }
                            src = { image.src } />
                        <Icon
                            className = { 'delete-image-icon' }
                            onClick = { () => deleteStoredImage(image) }
                            size = { 10 }
                            src = { IconTrash } />
                    </Tooltip>
                ))}
            </div>
        </Dialog>
    );
}

export default translate(connect()(VirtualBackground));
