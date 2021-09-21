// @flow

import Spinner from '@atlaskit/spinner';
import Bourne from '@hapi/bourne';
import { jitsiLocalStorage } from '@jitsi/js-utils/jitsi-local-storage';
import React, { useState, useEffect, useCallback } from 'react';

import { Dialog, hideDialog, openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { Icon, IconCloseSmall, IconShareDesktop } from '../../base/icons';
import { browser, JitsiTrackErrors } from '../../base/lib-jitsi-meet';
import { createLocalTrack } from '../../base/lib-jitsi-meet/functions';
import { connect } from '../../base/redux';
import { updateSettings } from '../../base/settings';
import { Tooltip } from '../../base/tooltip';
import { getLocalVideoTrack } from '../../base/tracks';
import { showErrorNotification } from '../../notifications';
import { toggleBackgroundEffect } from '../actions';
import { IMAGES, BACKGROUNDS_LIMIT, VIRTUAL_BACKGROUND_TYPE, type Image } from '../constants';
import { toDataURL } from '../functions';
import logger from '../logger';

import UploadImageButton from './UploadImageButton';
import ResizeAndDrag from './ResizeAndDrag';
import VirtualBackgroundPreview from './VirtualBackgroundPreview';

type Props = {

    /**
     * The list of Images to choose from.
     */
    _images: Array<Image>,

    /**
     * The current local flip x status.
     */
    _localFlipX: boolean,

    /**
     * Returns the jitsi track that will have backgraund effect applied.
     */
    _jitsiTrack: Object,

    /**
     * Returns the selected thumbnail identifier.
     */
    _selectedThumbnail: string,

    /**
     * If the upload button should be displayed or not.
     */
    _showUploadButton: boolean,

    /**
     * Returns the selected virtual background object.
     */
    _virtualBackground: Object,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The initial options copied in the state for the {@code VirtualBackground} component.
     *
     * NOTE: currently used only for electron in order to open the dialog in the correct state after desktop sharing
     * selection.
     */
    initialOptions: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

const onError = event => {
    event.target.style.display = 'none';
};


/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code VirtualBackground} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{Props}}
 */
function _mapStateToProps(state): Object {
    const { localFlipX } = state['features/base/settings'];
    const dynamicBrandingImages = state['features/dynamic-branding'].virtualBackgrounds;
    const hasBrandingImages = Boolean(dynamicBrandingImages.length);

    return {
        _localFlipX: Boolean(localFlipX),
        _images: (hasBrandingImages && dynamicBrandingImages) || IMAGES,
        _virtualBackground: state['features/virtual-background'],
        _selectedThumbnail: state['features/virtual-background'].selectedThumbnail,
        _showUploadButton: !(hasBrandingImages || state['features/base/config'].disableAddingBackgroundImages),
        _jitsiTrack: getLocalVideoTrack(state['features/base/tracks'])?.jitsiTrack
    };
}

const VirtualBackgroundDialog = translate(connect(_mapStateToProps)(VirtualBackground));

/**
 * Renders virtual background dialog.
 *
 * @returns {ReactElement}
 */
function VirtualBackground({
    _images,
    _jitsiTrack,
    _localFlipX,
    _selectedThumbnail,
    _showUploadButton,
    _virtualBackground,
    dispatch,
    initialOptions,
    t
}: Props) {
    const [ tempDesktopVideos, setTempDesktopVideos ] = useState([]);
    const [ existingSharing, setExistingSharing ] = useState(null);
    const [ selectedThumbnail, setSelectedThumbnail ] = useState(_selectedThumbnail);
    const [ previewIsLoaded, setPreviewIsLoaded ] = useState(false);
    const [ dragAndDropOpt, setDragAndDropOpt ] = useState({});
    const [ options, setOptions ] = useState({ ...initialOptions });
    const localImages = jitsiLocalStorage.getItem('virtualBackgrounds');
    const [ storedImages, setStoredImages ] = useState<Array<Image>>((localImages && Bourne.parse(localImages)) || []);
    const [ loading, setLoading ] = useState(false);
    const uploadImageButton: Object = useRef(null);
    const [ initialVirtualBackground ] = useState(_virtualBackground);
    const deleteStoredImage = useCallback(e => {
        const imageId = e.currentTarget.getAttribute('data-imageid');

        setStoredImages(storedImages.filter(item => item.id !== imageId));
    }, [ storedImages ]);

    const deleteStoredImageKeyPress = useCallback(e => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            deleteStoredImage(e);
        }
    }, [ deleteStoredImage ]);

    /**
     * Updates stored images on local storage.
     */
    useEffect(() => {
        try {
            jitsiLocalStorage.setItem('virtualBackgrounds', JSON.stringify(storedImages));
        } catch (err) {
            // Preventing localStorage QUOTA_EXCEEDED_ERR
            err && setStoredImages(storedImages.slice(1));
        }
        if (storedImages.length === BACKGROUNDS_LIMIT) {
            setStoredImages(storedImages.slice(1));
        }
    }, [ storedImages ]);

    const destroyTemporaryTracks = () => {
        for (let i = 0; i < tempDesktopVideos.length; i++) {
            if (tempDesktopVideos[i]) {
                tempDesktopVideos[i].dispose();
            }
        }

        if (options.backgroundType !== VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE_TRANSFORM
            && dragAndDropOpt.url) {
            dragAndDropOpt.url.dispose();
            dragAndDropOpt.jitsiTrack.dispose();
        }
        if (options.backgroundType !== VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE_TRANSFORM
            && initialVirtualBackground.backgroundType === VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE_TRANSFORM) {
            initialVirtualBackground.dragAndDropOptions.url.dispose();
            initialVirtualBackground.dragAndDropOptions.jitsiTrack.dispose();
        }
    };

    const enableBlur = useCallback(async () => {
        setSelectedThumbnail(VIRTUAL_BACKGROUND_TYPE.BLUR);
        setOptions({
            backgroundType: VIRTUAL_BACKGROUND_TYPE.BLUR,
            enabled: true,
            blurValue: 25,
            selectedThumbnail: 'blur',
            dragAndDropOptions: dragAndDropOpt
        });
        logger.info('"Blur" option setted for virtual background preview!');

    }, []);

    const enableBlurKeyPress = useCallback(e => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            enableBlur();
        }
    }, [ enableBlur ]);

    const enableSlideBlur = useCallback(async () => {
        setSelectedThumbnail('slight-blur');
        setOptions({
            backgroundType: VIRTUAL_BACKGROUND_TYPE.BLUR,
            enabled: true,
            blurValue: 8,
            selectedThumbnail: 'slight-blur',
            dragAndDropOptions: dragAndDropOpt
        });
        logger.info('"Slight-blur" option setted for virtual background preview!');

    }, []);

    const enableSlideBlurKeyPress = useCallback(e => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            enableSlideBlur();
        }
    }, [ enableSlideBlur ]);

    const shareTransparentDesktop = useCallback(async () => {
        dragAndDropOpt?.url && await setTempDesktopVideos(oldArray => [ ...oldArray, dragAndDropOpt.url ]);
        if (options.backgroundType === VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE_TRANSFORM
            || initialVirtualBackground.backgroundType === VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE_TRANSFORM) {

            if (initialVirtualBackground?.virtualSource) {
                await setExistingSharing(initialVirtualBackground);
            } else {
                await setExistingSharing(dragAndDropOpt);
            }
        }
        setSelectedThumbnail('transparent-preview');
    });

    const removeBackground = useCallback(async () => {
        setSelectedThumbnail('none');
        setOptions({
            enabled: false,
            selectedThumbnail: 'none',
            dragAndDropOptions: dragAndDropOpt
        });
        logger.info('"None" option setted for virtual background preview!');

    }, []);

    const removeBackgroundKeyPress = useCallback(e => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            removeBackground();
        }
    }, [ removeBackground ]);

    const setUploadedImageBackground = useCallback(async e => {
        const imageId = e.currentTarget.getAttribute('data-imageid');
        const image = storedImages.find(img => img.id === imageId);

        if (image) {
            setOptions({
                backgroundType: 'image',
                enabled: true,
                url: image.src,
                selectedThumbnail: image.id,
                dragAndDropOptions: dragAndDropOpt
            });
            setSelectedThumbnail(image.id);
            logger.info('Uploaded image setted for virtual background preview!');
        }
    }, [ storedImages ]);

    const setImageBackground = useCallback(async e => {
        const imageId = e.currentTarget.getAttribute('data-imageid');
        const image = _images.find(img => img.id === imageId);

        if (image) {
            const url = await toDataURL(image.src);

            setOptions({
                backgroundType: 'image',
                enabled: true,
                url,
                selectedThumbnail: image.id,
                dragAndDropOptions: dragAndDropOpt
            });
            setSelectedThumbnail(image.id);
            logger.info('Image setted for virtual background preview!');

            setLoading(false);
        }
    }, []);

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

    const applyVirtualBackground = useCallback(async () => {
        destroyTemporaryTracks();
        if (options.backgroundType !== VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE_TRANSFORM
            && initialVirtualBackground.backgroundType === VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE_TRANSFORM) {
            initialVirtualBackground.dragAndDropOptions.url.dispose();
            initialVirtualBackground.dragAndDropOptions.jitsiTrack.dispose();
        }
        setLoading(true);
        await dispatch(toggleBackgroundEffect(options, _jitsiTrack));
        await setLoading(false);
        if ((_localFlipX && options.backgroundType === VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE)
            || (_localFlipX && options.backgroundType === VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE_TRANSFORM)) {
            dispatch(updateSettings({
                localFlipX: !_localFlipX
            }));
        } else {

            // Set x scale to default value.
            dispatch(updateSettings({
                localFlipX: true
            }));
        }
        dispatch(hideDialog());
        logger.info(`Virtual background type: '${typeof options.backgroundType === 'undefined'
            ? 'none' : options.backgroundType}' applied!`);
    }, [ dispatch, options, _localFlipX ]);

    // Prevent the selection of a new virtual background if it has not been applied by default
    const cancelVirtualBackground = useCallback(async () => {
        await setOptions({
            backgroundType: initialVirtualBackground.backgroundType,
            enabled: initialVirtualBackground.backgroundEffectEnabled,
            url: initialVirtualBackground.virtualSource,
            selectedThumbnail: initialVirtualBackground.selectedThumbnail,
            blurValue: initialVirtualBackground.blurValue,
            dragAndDropOptions: dragAndDropOpt
        });
        destroyTemporaryTracks();
        dispatch(hideDialog());
    });

    const updateTransparentOptions = useCallback(async dragAndDropOptions => {
        await setDragAndDropOpt(dragAndDropOptions);
        setOptions({
            backgroundType: VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE_TRANSFORM,
            enabled: true,
            selectedThumbnail: 'desktop-share-transform',
            dragAndDropOptions,
            url: dragAndDropOptions.url
        });
        logger.info('"Transparent" option setted for virtual background preview!');
        await setPreviewIsLoaded(true);
    }, []);

    const loadedPreviewState = useCallback(async loaded => {
        await setPreviewIsLoaded(loaded);
    });

    return (
        <Dialog
            hideCancelButton = { false }
            okKey = { 'virtualBackground.apply' }
            onCancel = { cancelVirtualBackground }
            onSubmit = { applyVirtualBackground }
            submitDisabled = { !options || loading || !previewIsLoaded }
            titleKey = { 'virtualBackground.title' } >
            {selectedThumbnail === 'desktop-share-transform'
                || selectedThumbnail === 'transparent-preview'
                ? <div className = 'virtual-background-preview-dnd'>
                    <ResizeAndDrag
                        dispatch = { dispatch }
                        screen = { existingSharing }
                        updateTransparent = { updateTransparentOptions } />
                </div>
                : <div className = 'virtual-background-preview'>
                    <VirtualBackgroundPreview
                        loadedPreview = { loadedPreviewState }
                        options = { options } />
                </div>}
            {loading ? (
                <div className = 'virtual-background-loading'>
                    <Spinner
                        isCompleting = { false }
                        size = 'medium' />
                </div>
            ) : (
                <div>
                    {_showUploadButton
                    && <UploadImageButton
                        setLoading = { setLoading }
                        setOptions = { setOptions }
                        setStoredImages = { setStoredImages }
                        showLabel = { previewIsLoaded }
                        storedImages = { storedImages } />}
                    <div
                        className = 'virtual-background-dialog'
                        role = 'radiogroup'
                        tabIndex = '-1'>
                        <Tooltip
                            content = { t('virtualBackground.removeBackground') }
                            position = { 'top' }>
                            <div
                                aria-checked = { _selectedThumbnail === 'none' }
                                aria-label = { t('virtualBackground.removeBackground') }
                                className = { _selectedThumbnail === 'none' ? 'background-option none-selected'
                                    : 'background-option virtual-background-none' }
                                onClick = { removeBackground }
                                onKeyPress = { removeBackgroundKeyPress }
                                role = 'radio'
                                tabIndex = { 0 } >
                                {t('virtualBackground.none')}
                            </div>
                        </Tooltip>
                        <Tooltip
                            content = { t('virtualBackground.slightBlur') }
                            position = { 'top' }>
                            <div
                                aria-checked = { _selectedThumbnail === 'slight-blur' }
                                aria-label = { t('virtualBackground.slightBlur') }
                                className = { _selectedThumbnail === 'slight-blur'
                                    ? 'background-option slight-blur-selected' : 'background-option slight-blur' }
                                onClick = { enableSlideBlur }
                                onKeyPress = { enableSlideBlurKeyPress }
                                role = 'radio'
                                tabIndex = { 0 }>
                                {t('virtualBackground.slightBlur')}
                            </div>
                        </Tooltip>
                        <Tooltip
                            content = { t('virtualBackground.blur') }
                            position = { 'top' }>
                            <div
                                aria-checked = { _selectedThumbnail === 'blur' }
                                aria-label = { t('virtualBackground.blur') }
                                className = { _selectedThumbnail === 'blur' ? 'background-option blur-selected'
                                    : 'background-option blur' }
                                onClick = { enableBlur }
                                onKeyPress = { enableBlurKeyPress }
                                role = 'radio'
                                tabIndex = { 0 }>
                                {t('virtualBackground.blur')}
                            </div>
                        </Tooltip>
                        <Tooltip
                            content = { t('virtualBackground.desktopShare') }
                            position = { 'top' }>
                            <div
                                aria-checked = { selectedThumbnail === 'desktop-share-transform' }
                                aria-label = { t('virtualBackground.desktopShare') }
                                className = { selectedThumbnail === 'desktop-share-transform'
                                    ? 'background-option desktop-share-transform-selected'
                                    : 'background-option desktop-share-transform' }
                                onClick = { shareTransparentDesktop }
                                role = 'radio'
                                tabIndex = { 0 }>
                                <Icon
                                    className = 'share-desktop-icon'
                                    size = { 30 }
                                    src = { IconShareDesktop } />
                            </div>
                        </Tooltip>
                        {_images.map(image => (
                            <Tooltip
                                content = { image.tooltip && t(`virtualBackground.${image.tooltip}`) }
                                key = { image.id }
                                position = { 'top' }>
                                <img
                                    alt = { image.tooltip && t(`virtualBackground.${image.tooltip}`) }
                                    aria-checked = { options.selectedThumbnail === image.id
                                        || _selectedThumbnail === image.id }
                                    className = {
                                        options.selectedThumbnail === image.id || _selectedThumbnail === image.id
                                            ? 'background-option thumbnail-selected' : 'background-option thumbnail' }
                                    data-imageid = { image.id }
                                    onClick = { setImageBackground }
                                    onError = { onError }
                                    onKeyPress = { setImageBackgroundKeyPress }
                                    role = 'radio'
                                    src = { image.src }
                                    tabIndex = { 0 } />
                            </Tooltip>
                        ))}
                        {storedImages.map((image, index) => (
                            <div
                                className = { 'thumbnail-container' }
                                key = { image.id }>
                                <img
                                    alt = { t('virtualBackground.uploadedImage', { index: index + 1 }) }
                                    aria-checked = { _selectedThumbnail === image.id }
                                    className = { _selectedThumbnail === image.id
                                        ? 'background-option thumbnail-selected' : 'background-option thumbnail' }
                                    data-imageid = { image.id }
                                    onClick = { setUploadedImageBackground }
                                    onError = { onError }
                                    onKeyPress = { setUploadedImageBackgroundKeyPress }
                                    role = 'radio'
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
                                    src = { IconCloseSmall }
                                    tabIndex = { 0 } />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Dialog>
    );
}

export default VirtualBackgroundDialog;
