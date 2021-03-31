// @flow

import Spinner from '@atlaskit/spinner';
import { jitsiLocalStorage } from '@jitsi/js-utils/jitsi-local-storage';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import uuid from 'uuid';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { Icon, IconBlurBackground, IconCancelSelection } from '../../base/icons';
import { connect } from '../../base/redux';
import { Tooltip } from '../../base/tooltip';
import { toggleBackgroundEffect, setVirtualBackground } from '../actions';
import { resizeImage, toDataURL } from '../functions';
import logger from '../logger';

type Image = {
    tooltip?: string,
    id: string,
    src: string
}

// The limit of virtual background uploads is 21. When the number
// of uploads is 22 we trigger the deleteStoredImage function to delete
// the first/oldest uploaded background.
const backgroundsLimit = 22;
const images: Array<Image> = [
    {
        tooltip: 'image1',
        id: '1',
        src: 'images/virtual-background/background-1.jpg'
    },
    {
        tooltip: 'image2',
        id: '2',
        src: 'images/virtual-background/background-2.jpg'
    },
    {
        tooltip: 'image3',
        id: '3',
        src: 'images/virtual-background/background-3.jpg'
    },
    {
        tooltip: 'image4',
        id: '4',
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

const onError = event => {
    event.target.style.display = 'none';
};

/**
 * Renders virtual background dialog.
 *
 * @returns {ReactElement}
 */
function VirtualBackground({ dispatch, t }: Props) {
    const localImages = jitsiLocalStorage.getItem('virtualBackgrounds');
    const [ storedImages, setStoredImages ] = useState<Array<Image>>((localImages && JSON.parse(localImages)) || []);
    const [ loading, isloading ] = useState(false);
    const uploadImageButton: Object = useRef(null);

    /**
     * Updates stored images on local storage.
     */
    useEffect(() => {
        jitsiLocalStorage.setItem('virtualBackgrounds', JSON.stringify(storedImages));
        if (storedImages.length === backgroundsLimit) {
            setStoredImages(storedImages.slice(1));
        }
    }, [ storedImages ]);

    const [ selected, setSelected ] = useState('');

    const enableBlur = useCallback(async () => {
        isloading(true);
        setSelected('blur');
        await dispatch(setVirtualBackground('', false));
        await dispatch(toggleBackgroundEffect(true));
        isloading(false);
    }, [ dispatch ]);

    const removeBackground = useCallback(async () => {
        isloading(true);
        setSelected('none');
        await dispatch(setVirtualBackground('', false));
        await dispatch(toggleBackgroundEffect(false));
        isloading(false);
    }, [ dispatch ]);

    const setImageBackground = useCallback(async e => {
        const imageId = e.currentTarget.getAttribute('data-imageid');
        const image = images.find(img => img.id === imageId);

        if (image) {
            isloading(true);
            setSelected(image.id);
            await dispatch(setVirtualBackground(await toDataURL(image.src), true));
            await dispatch(toggleBackgroundEffect(true));
            isloading(false);
        }
    }, [ dispatch ]);

    const setUploadedImageBackground = useCallback(async e => {
        const imageId = e.currentTarget.getAttribute('data-imageid');
        const image = storedImages.find(img => img.id === imageId);

        if (image) {
            isloading(true);
            setSelected(image.id);
            await dispatch(setVirtualBackground(image.src, true));
            await dispatch(toggleBackgroundEffect(true));
            isloading(false);
        }
    }, [ dispatch, storedImages ]);

    const deleteStoredImage = useCallback(e => {
        const imageId = e.currentTarget.getAttribute('data-imageid');

        setStoredImages(storedImages.filter(item => item.id !== imageId));
    }, [ storedImages ]);

    const uploadImage = useCallback(async e => {
        const reader = new FileReader();
        const imageFile = e.target.files;

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
    }, [ dispatch, storedImages ]);

    const enableBlurKeyPress = useCallback(e => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            enableBlur();
        }
    }, [ enableBlur ]);

    const removeBackgroundKeyPress = useCallback(e => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            removeBackground();
        }
    }, [ removeBackground ]);

    const setImageBackgroundKeyPress = useCallback(e => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            setImageBackground(e);
        }
    }, [ setImageBackground ]);

    const setUploadedImageBackgroundKeyPress = useCallback(e => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            setUploadedImageBackground(e);
        }
    }, [ setUploadedImageBackground ]);

    const deleteStoredImageKeyPress = useCallback(e => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            deleteStoredImage(e);
        }
    }, [ deleteStoredImage ]);

    const uploadImageKeyPress = useCallback(e => {
        if (uploadImageButton.current && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            uploadImageButton.current.click();
        }
    }, [ uploadImageButton.current ]);

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
                                aria-label = { t('virtualBackground.removeBackground') }
                                className = { selected === 'none' ? 'none-selected' : 'virtual-background-none' }
                                onClick = { removeBackground }
                                onKeyPress = { removeBackgroundKeyPress }
                                role = 'button'
                                tabIndex = { 0 } >
                                {t('virtualBackground.none')}
                            </div>
                        </Tooltip>
                        <Tooltip
                            content = { t('virtualBackground.enableBlur') }
                            position = { 'top' }>
                            <Icon
                                ariaLabel = { t('virtualBackground.enableBlur') }
                                className = { selected === 'blur' ? 'blur-selected' : '' }
                                onClick = { enableBlur }
                                onKeyPress = { enableBlurKeyPress }
                                role = 'button'
                                size = { 50 }
                                src = { IconBlurBackground }
                                tabIndex = { 0 } />
                        </Tooltip>
                        {images.map(image => (
                            <Tooltip
                                content = { image.tooltip && t(`virtualBackground.${image.tooltip}`) }
                                key = { image.id }
                                position = { 'top' }>
                                <img
                                    alt = { image.tooltip && t(`virtualBackground.${image.tooltip}`) }
                                    className = { selected === image.id ? 'thumbnail-selected' : 'thumbnail' }
                                    data-imageid = { image.id }
                                    onClick = { setImageBackground }
                                    onError = { onError }
                                    onKeyPress = { setImageBackgroundKeyPress }
                                    role = 'button'
                                    src = { image.src }
                                    tabIndex = { 0 } />
                            </Tooltip>
                        ))}
                        <Tooltip
                            content = { t('virtualBackground.uploadImage') }
                            position = { 'top' }>
                            <label
                                aria-label = { t('virtualBackground.uploadImage') }
                                className = 'custom-file-upload'
                                htmlFor = 'file-upload'
                                onKeyPress = { uploadImageKeyPress }
                                role = 'button'
                                tabIndex = { 0 }>
                                +
                            </label>
                            <input
                                accept = 'image/*'
                                className = 'file-upload-btn'
                                id = 'file-upload'
                                onChange = { uploadImage }
                                ref = { uploadImageButton }
                                type = 'file' />
                        </Tooltip>
                    </div>

                    <div className = 'virtual-background-dialog'>
                        {storedImages.map((image, index) => (
                            <div
                                className = { 'thumbnail-container' }
                                key = { image.id }>
                                <img
                                    alt = { t('virtualBackground.uploadedImage', { index: index + 1 }) }
                                    className = { selected === image.id ? 'thumbnail-selected' : 'thumbnail' }
                                    data-imageid = { image.id }
                                    onClick = { setUploadedImageBackground }
                                    onError = { onError }
                                    onKeyPress = { setUploadedImageBackgroundKeyPress }
                                    role = 'button'
                                    src = { image.src }
                                    tabIndex = { 0 } />
                                <Icon
                                    ariaLabel = { t('virtualBackground.deleteImage') }
                                    className = { 'delete-image-icon' }
                                    data-imageid = { image.id }
                                    onClick = { deleteStoredImage }
                                    onKeyPress = { deleteStoredImageKeyPress }
                                    role = 'button'
                                    size = { 15 }
                                    src = { IconCancelSelection }
                                    tabIndex = { 0 } />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Dialog>
    );
}

export default translate(connect()(VirtualBackground));
