// @flow
/* eslint-disable react/jsx-no-bind, no-return-assign */
import Spinner from '@atlaskit/spinner';
import { jitsiLocalStorage } from '@jitsi/js-utils/jitsi-local-storage';
import React, { useState, useEffect } from 'react';
import uuid from 'uuid';

import { Dialog, hideDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { Icon, IconCloseSmall, IconPlusCircle } from '../../base/icons';
import { connect } from '../../base/redux';
import { getLocalVideoTrack } from '../../base/tracks';
import { toggleBackgroundEffect } from '../actions';
import { resizeImage, toDataURL } from '../functions';
import logger from '../logger';

import VirtualBackgroundPreview from './VirtualBackgroundPreview';

// The limit of virtual background uploads is 24. When the number
// of uploads is 25 we trigger the deleteStoredImage function to delete
// the first/oldest uploaded background.
const backgroundsLimit = 25;
const images = [
    {
        id: '1',
        src: 'images/virtual-background/background-1.jpg'
    },
    {
        id: '2',
        src: 'images/virtual-background/background-2.jpg'
    },
    {
        id: '3',
        src: 'images/virtual-background/background-3.jpg'
    },
    {
        id: '4',
        src: 'images/virtual-background/background-4.jpg'
    },
    {
        id: '5',
        src: 'images/virtual-background/background-5.jpg'
    },
    {
        id: '6',
        src: 'images/virtual-background/background-6.jpg'
    },
    {
        id: '7',
        src: 'images/virtual-background/background-7.jpg'
    }
];
type Props = {

    /**
     * Returns the jitsi track that will have backgraund effect applied.
     */
    _jitsiTrack: Object,

    /**
     * Returns the selected thumbnail identifier.
     */
    _selectedThumbnail: string,

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
function VirtualBackground({ _jitsiTrack, _selectedThumbnail, dispatch, t }: Props) {
    const [ options, setOptions ] = useState({});
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
        try {
            jitsiLocalStorage.setItem('virtualBackgrounds', JSON.stringify(storedImages));
        } catch (err) {
            // Preventing localStorage QUOTA_EXCEEDED_ERR
            err && deleteStoredImage(storedImages[0]);
        }
        if (storedImages.length === backgroundsLimit) {
            deleteStoredImage(storedImages[0]);
        }
    }, [ storedImages ]);

    const enableBlur = async (blurValue, selection) => {
        setOptions({
            backgroundType: 'blur',
            enabled: true,
            blurValue,
            selectedThumbnail: selection
        });
    };

    const removeBackground = async () => {
        setOptions({
            enabled: false,
            selectedThumbnail: 'none'
        });
    };

    const setUploadedImageBackground = async image => {
        setOptions({
            backgroundType: 'image',
            enabled: true,
            url: image.src,
            selectedThumbnail: image.id
        });
    };

    const setImageBackground = async image => {
        const url = await toDataURL(image.src);

        setOptions({
            backgroundType: 'image',
            enabled: true,
            url,
            selectedThumbnail: image.id
        });
    };

    const uploadImage = async imageFile => {
        const reader = new FileReader();

        reader.readAsDataURL(imageFile[0]);
        reader.onload = async () => {
            const url = await resizeImage(reader.result);
            const uuId = uuid.v4();

            setStoredImages([
                ...storedImages,
                {
                    id: uuId,
                    src: url
                }
            ]);
            setOptions({
                backgroundType: 'image',
                enabled: true,
                url,
                selectedThumbnail: uuId
            });
        };
        reader.onerror = () => {
            isloading(false);
            logger.error('Failed to upload virtual image!');
        };
    };

    const applyVirtualBackground = async () => {
        isloading(true);
        await dispatch(toggleBackgroundEffect(options, _jitsiTrack));
        await isloading(false);
        dispatch(hideDialog());
    };

    return (
        <Dialog
            hideCancelButton = { false }
            okKey = { 'virtualBackground.apply' }
            onSubmit = { applyVirtualBackground }
            submitDisabled = { !options || loading }
            titleKey = { 'virtualBackground.title' } >
            <VirtualBackgroundPreview options = { options } />
            {loading ? (
                <div className = 'virtual-background-loading'>
                    <Spinner
                        isCompleting = { false }
                        size = 'medium' />
                </div>
            ) : (
                <div>
                    <label
                        className = 'file-upload-label'
                        htmlFor = 'file-upload'>
                        <Icon
                            className = { 'add-background' }
                            size = { 20 }
                            src = { IconPlusCircle } />
                        {t('virtualBackground.addBackground')}
                    </label>
                    <input
                        accept = 'image/*'
                        className = 'file-upload-btn'
                        id = 'file-upload'
                        onChange = { e => uploadImage(e.target.files) }
                        type = 'file' />
                    <div className = 'virtual-background-dialog'>
                        <div
                            className = { _selectedThumbnail === 'none' ? 'none-selected' : 'virtual-background-none' }
                            onClick = { removeBackground }>
                            {t('virtualBackground.none')}
                        </div>
                        <div
                            className = { _selectedThumbnail === 'slight-blur'
                                ? 'slight-blur-selected' : 'slight-blur' }
                            onClick = { () => enableBlur(8, 'slight-blur') }>
                            {t('virtualBackground.slightBlur')}
                        </div>
                        <div
                            className = { _selectedThumbnail === 'blur' ? 'blur-selected' : 'blur' }
                            onClick = { () => enableBlur(25, 'blur') }>
                            {t('virtualBackground.blur')}
                        </div>
                        {images.map((image, index) => (
                            <img
                                className = {
                                    options.selectedThumbnail === image.id || _selectedThumbnail === image.id
                                        ? 'thumbnail-selected'
                                        : 'thumbnail'
                                }
                                key = { index }
                                onClick = { () => setImageBackground(image) }
                                onError = { event => event.target.style.display = 'none' }
                                src = { image.src } />
                        ))}
                        {storedImages.map((image, index) => (
                            <div
                                className = { 'thumbnail-container' }
                                key = { index }>
                                <img
                                    className = { _selectedThumbnail === image.id ? 'thumbnail-selected' : 'thumbnail' }
                                    onClick = { () => setUploadedImageBackground(image) }
                                    onError = { event => event.target.style.display = 'none' }
                                    src = { image.src } />
                                <Icon
                                    className = { 'delete-image-icon' }
                                    onClick = { () => deleteStoredImage(image) }
                                    size = { 15 }
                                    src = { IconCloseSmall } />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Dialog>
    );
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code VirtualBackground} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{Props}}
 */
function _mapStateToProps(state): Object {
    return {
        _selectedThumbnail: state['features/virtual-background'].selectedThumbnail,
        _jitsiTrack: getLocalVideoTrack(state['features/base/tracks'])?.jitsiTrack
    };
}

export default translate(connect(_mapStateToProps)(VirtualBackground));
