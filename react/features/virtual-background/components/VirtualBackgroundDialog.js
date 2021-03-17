// @flow
/* eslint-disable react/jsx-no-bind, no-return-assign */
import Spinner from '@atlaskit/spinner';
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
    const localImages = localStorage.getItem('storedImages');
    const [ storedImages, setStoredImages ] = useState((localImages && JSON.parse(localImages)) || []);
    const [ loading, isloading ] = useState(false);


    /**
     * Updates stored images on local storage.
     */
    useEffect(() => {
        localStorage.setItem('storedImages', JSON.stringify(storedImages));
    }, [ storedImages ]);

    const [ selected, setSelected ] = useState('');
    const enableBlur = async () => {
        isloading(true);
        setSelected('blur');
        await dispatch(setVirtualBackground('', false));
        await dispatch(toggleBackgroundEffect(true));
        isloading(false);
    };

    const removeBackground = async () => {
        isloading(true);
        setSelected('none');
        await dispatch(setVirtualBackground('', false));
        await dispatch(toggleBackgroundEffect(false));
        isloading(false);
    };

    const addImageBackground = async image => {
        isloading(true);
        setSelected(image.id);
        await dispatch(setVirtualBackground(image.src, true));
        await dispatch(toggleBackgroundEffect(true));
        isloading(false);
    };

    const deleteStoredImage = image => {
        setStoredImages(storedImages.filter(item => item !== image));
    };

    const uploadImage = async imageFile => {
        const reader = new FileReader();

        reader.readAsDataURL(imageFile[0]);
        reader.onload = async () => {
            isloading(true);
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

            await dispatch(setVirtualBackground(reader.result.toString(), true));
            await dispatch(toggleBackgroundEffect(true));
            isloading(false);
        };
        reader.onerror = () => {
            isloading(false);
            throw new Error('Failed to upload virtual image!');
        };
    };

    return (
        <Dialog
            hideCancelButton = { true }
            submitDisabled = { false }
            titleKey = { 'virtualBackground.title' }
            width = 'small'>
            {loading ? (
                <div>
                    <span>{ t('virtualBackground.pleaseWait') }</span>
                    <Spinner
                        isCompleting = { false }
                        size = 'medium' />
                </div>
            ) : (
                <div>
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
                </div>
            )}
        </Dialog>
    );
}

export default translate(connect()(VirtualBackground));
