// @flow
/* eslint-disable react/jsx-no-bind, no-return-assign */
import Spinner from '@atlaskit/spinner';
import { jitsiLocalStorage } from '@jitsi/js-utils/jitsi-local-storage';
import React, { useState, useEffect } from 'react';
import uuid from 'uuid';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { Icon, IconBlurBackground, IconCancelSelection } from '../../base/icons';
import { connect } from '../../base/redux';
import { Tooltip } from '../../base/tooltip';
import { toggleBackgroundEffect, setVirtualBackground } from '../actions';
import { resizeImage, toDataURL } from '../functions';
import logger from '../logger';

// The limit of virtual background uploads is 21. When the number
// of uploads is 22 we trigger the deleteStoredImage function to delete
// the first/oldest uploaded background.
const backgroundsLimit = 22;
const images = [
    {
        id: 1,
        src: 'images/virtual-background/background-1.jpg'
    },
    {
        id: 2,
        src: 'images/virtual-background/background-2.jpg'
    },
    {
        id: 3,
        src: 'images/virtual-background/background-3.jpg'
    },
    {
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
    const localImages = jitsiLocalStorage.getItem('virtualBackgrounds');
    const [ storedImages, setStoredImages ] = useState((localImages && JSON.parse(localImages)) || []);
    const [ loading, isloading ] = useState(false);

    const deleteStoredImage = image => {
        setStoredImages(storedImages.filter(item => item !== image));
    };

    /**
     * Updates stored images on local storage.
     */
    useEffect(() => {
        jitsiLocalStorage.setItem('virtualBackgrounds', JSON.stringify(storedImages));
        if (storedImages.length === backgroundsLimit) {
            deleteStoredImage(storedImages[0]);
        }
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

    const setUploadedImageBackground = async image => {
        isloading(true);
        setSelected(image.id);
        await dispatch(setVirtualBackground(image.src, true));
        await dispatch(toggleBackgroundEffect(true));
        isloading(false);
    };

    const setImageBackground = async image => {
        isloading(true);
        setSelected(image.id);
        await dispatch(setVirtualBackground(await toDataURL(image.src), true));
        await dispatch(toggleBackgroundEffect(true));
        isloading(false);
    };

    const uploadImage = async imageFile => {
        const reader = new FileReader();

        reader.readAsDataURL(imageFile[0]);
        reader.onload = async () => {
            const resizedImage = await resizeImage(reader.result);

            isloading(true);
            setStoredImages([
                ...storedImages,
                {
                    id: uuid.v4(),
                    src: resizedImage
                }
            ]);

            await dispatch(setVirtualBackground(resizedImage, true));
            await dispatch(toggleBackgroundEffect(true));
            isloading(false);
        };
        reader.onerror = () => {
            isloading(false);
            logger.error('Failed to upload virtual image!');
        };
    };

    return (
        <Dialog
            hideCancelButton = { true }
            submitDisabled = { false }
            titleKey = { 'virtualBackground.title' }
            width = 'small'>
            {loading ? (
                <div className = 'virtual-background-loading'>
                    <span className = 'loading-content-text'>{t('virtualBackground.pleaseWait')}</span>
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
                                onClick = { removeBackground }>
                                {t('virtualBackground.none')}
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
                            <img
                                className = { selected === image.id ? 'thumbnail-selected' : 'thumbnail' }
                                key = { index }
                                onClick = { () => setImageBackground(image) }
                                onError = { event => event.target.style.display = 'none' }
                                src = { image.src } />
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
                            <div
                                className = { 'thumbnail-container' }
                                key = { index }>
                                <img
                                    className = { selected === image.id ? 'thumbnail-selected' : 'thumbnail' }
                                    onClick = { () => setUploadedImageBackground(image) }
                                    onError = { event => event.target.style.display = 'none' }
                                    src = { image.src } />
                                <Icon
                                    className = { 'delete-image-icon' }
                                    onClick = { () => deleteStoredImage(image) }
                                    size = { 15 }
                                    src = { IconCancelSelection } />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Dialog>
    );
}

export default translate(connect()(VirtualBackground));
