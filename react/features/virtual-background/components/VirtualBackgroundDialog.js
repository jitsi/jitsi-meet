// @flow

import Spinner from '@atlaskit/spinner';
import Bourne from '@hapi/bourne';
import { jitsiLocalStorage } from '@jitsi/js-utils/jitsi-local-storage';
import { makeStyles } from '@material-ui/styles';
import clsx from 'clsx';
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { Dialog, hideDialog, openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { Icon, IconCloseSmall, IconShareDesktop } from '../../base/icons';
import { browser, JitsiTrackErrors } from '../../base/lib-jitsi-meet';
import { createLocalTrack } from '../../base/lib-jitsi-meet/functions';
import { VIDEO_TYPE } from '../../base/media';
import { connect } from '../../base/redux';
import { updateSettings } from '../../base/settings';
import { Tooltip } from '../../base/tooltip';
import { getLocalVideoTrack } from '../../base/tracks';
import { NOTIFICATION_TIMEOUT_TYPE, showErrorNotification } from '../../notifications';
import { toggleBackgroundEffect, virtualBackgroundTrackChanged } from '../actions';
import { IMAGES, BACKGROUNDS_LIMIT, VIRTUAL_BACKGROUND_TYPE, type Image } from '../constants';
import { toDataURL } from '../functions';
import logger from '../logger';

import UploadImageButton from './UploadImageButton';
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

const useStyles = makeStyles(theme => {
    return {
        dialog: {
            marginLeft: '-10px',
            position: 'relative',
            maxHeight: '300px',
            color: 'white',
            display: 'inline-grid',
            gridTemplateColumns: 'auto auto auto auto auto',
            columnGap: '9px',
            cursor: 'pointer',
            [[ '& .desktop-share:hover',
                '& .thumbnail:hover',
                '& .blur:hover',
                '& .slight-blur:hover',
                '& .virtual-background-none:hover' ]]: {
                opacity: 0.5,
                border: '2px solid #99bbf3'
            },
            '& .background-option': {
                marginTop: `${theme.spacing(2)}px`,
                borderRadius: `${theme.shape.borderRadius}px`,
                height: '60px',
                width: '107px',
                textAlign: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center'
            },
            '& thumbnail-container': {
                position: 'relative',
                '&:focus-within .thumbnail ~ .delete-image-icon': {
                    display: 'block'
                }
            },
            '& .thumbnail': {
                objectFit: 'cover'
            },
            '& .thumbnail:hover ~ .delete-image-icon': {
                display: 'block'
            },
            '& .thumbnail-selected': {
                objectFit: 'cover',
                border: '2px solid #246fe5'
            },
            '& .blur': {
                boxShadow: 'inset 0 0 12px #000000',
                background: '#7e8287',
                padding: '0 10px'
            },
            '& .blur-selected': {
                border: '2px solid #246fe5'
            },
            '& .slight-blur': {
                boxShadow: 'inset 0 0 12px #000000',
                background: '#a4a4a4',
                padding: '0 10px'
            },
            '& .slight-blur-selected': {
                border: '2px solid #246fe5'
            },
            '& .virtual-background-none': {
                background: '#525252',
                padding: '0 10px'
            },
            '& .none-selected': {
                border: '2px solid #246fe5'
            },
            '& .desktop-share': {
                background: '#525252'
            },
            '& .desktop-share-selected': {
                border: '2px solid #246fe5',
                padding: '0 10px'
            },
            '& delete-image-icon': {
                background: '#3d3d3d',
                position: 'absolute',
                display: 'none',
                left: '96px',
                bottom: '51px',
                '&:hover': {
                    display: 'block'
                },
                '@media (max-width: 632px)': {
                    left: '51px'
                }
            },
            '@media (max-width: 360px)': {
                gridTemplateColumns: 'auto auto auto'
            },
            '@media (max-width: 632px)': {
                fontSize: '1.5vw',

                [[ '& .desktop-share:hover',
                    '& .thumbnail:hover',
                    '& .blur:hover',
                    '& .slight-blur:hover',
                    '& .virtual-background-none:hover' ]]: {
                    height: '60px',
                    width: '60px'
                },

                [[ '& .desktop-share',
                    '& .virtual-background-none,',
                    '& .thumbnail,',
                    '& .blur,',
                    '& .slight-blur' ]]: {
                    height: '60px',
                    width: '60px'
                },
                [[ '& .desktop-share-selected',
                    '& .thumbnail-selected',
                    '& .none-selected',
                    '& .blur-selected',
                    '& .slight-blur-selected' ]]: {
                    height: '60px',
                    width: '60px'
                }
            }
        },
        dialogMarginTop: {
            marginTop: '44px'
        },
        virtualBackgroundLoading: {
            overflow: 'hidden',
            position: 'fixed',
            left: '50%',
            marginTop: '10px',
            transform: 'translateX(-50%)'
        }
    };
});

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
    const classes = useStyles();
    const [ previewIsLoaded, setPreviewIsLoaded ] = useState(false);
    const [ options, setOptions ] = useState({ ...initialOptions });
    const localImages = jitsiLocalStorage.getItem('virtualBackgrounds');
    const [ storedImages, setStoredImages ] = useState<Array<Image>>((localImages && Bourne.parse(localImages)) || []);
    const [ loading, setLoading ] = useState(false);
    const { disableScreensharingVirtualBackground } = useSelector(state => state['features/base/config']);

    const [ activeDesktopVideo ] = useState(_virtualBackground?.virtualSource?.videoType === VIDEO_TYPE.DESKTOP
        ? _virtualBackground.virtualSource
        : null);
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

    const enableBlur = useCallback(async () => {
        setOptions({
            backgroundType: VIRTUAL_BACKGROUND_TYPE.BLUR,
            enabled: true,
            blurValue: 25,
            selectedThumbnail: 'blur'
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
        setOptions({
            backgroundType: VIRTUAL_BACKGROUND_TYPE.BLUR,
            enabled: true,
            blurValue: 8,
            selectedThumbnail: 'slight-blur'
        });
        logger.info('"Slight-blur" option setted for virtual background preview!');

    }, []);

    const enableSlideBlurKeyPress = useCallback(e => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            enableSlideBlur();
        }
    }, [ enableSlideBlur ]);


    const shareDesktop = useCallback(async () => {
        if (disableScreensharingVirtualBackground) {
            return;
        }

        let isCancelled = false, url;

        try {
            url = await createLocalTrack('desktop', '');
        } catch (e) {
            if (e.name === JitsiTrackErrors.SCREENSHARING_USER_CANCELED) {
                isCancelled = true;
            } else {
                logger.error(e);
            }
        }

        if (!url) {
            if (!isCancelled) {
                dispatch(showErrorNotification({
                    titleKey: 'virtualBackground.desktopShareError'
                }, NOTIFICATION_TIMEOUT_TYPE.LONG));
                logger.error('Could not create desktop share as a virtual background!');
            }

            /**
             * For electron createLocalTrack will open the {@code DesktopPicker} dialog and hide the
             * {@code VirtualBackgroundDialog}. That's why we need to reopen the {@code VirtualBackgroundDialog}
             * and restore the current state through {@code initialOptions} prop.
             */
            if (browser.isElectron()) {
                dispatch(openDialog(VirtualBackgroundDialog, { initialOptions: options }));
            }

            return;
        }

        const newOptions = {
            backgroundType: VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE,
            enabled: true,
            selectedThumbnail: 'desktop-share',
            url
        };

        /**
         * For electron createLocalTrack will open the {@code DesktopPicker} dialog and hide the
         * {@code VirtualBackgroundDialog}. That's why we need to reopen the {@code VirtualBackgroundDialog}
         * and force it to show desktop share virtual background through {@code initialOptions} prop.
         */
        if (browser.isElectron()) {
            dispatch(openDialog(VirtualBackgroundDialog, { initialOptions: newOptions }));
        } else {
            setOptions(newOptions);
            logger.info('"Desktop-share" option setted for virtual background preview!');
        }
    }, [ dispatch, options ]);

    const shareDesktopKeyPress = useCallback(e => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            shareDesktop();
        }
    }, [ shareDesktop ]);

    const removeBackground = useCallback(async () => {
        setOptions({
            enabled: false,
            selectedThumbnail: 'none'
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
                selectedThumbnail: image.id
            });
            logger.info('Uploaded image setted for virtual background preview!');
        }
    }, [ storedImages ]);

    const setImageBackground = useCallback(async e => {
        const imageId = e.currentTarget.getAttribute('data-imageid');
        const image = _images.find(img => img.id === imageId);

        if (image) {
            try {
                const url = await toDataURL(image.src);

                setOptions({
                    backgroundType: 'image',
                    enabled: true,
                    url,
                    selectedThumbnail: image.id
                });
                logger.info('Image set for virtual background preview!');
            } catch (err) {
                logger.error('Could not fetch virtual background image:', err);
            }

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
        if (activeDesktopVideo) {
            await activeDesktopVideo.dispose();
        }
        setLoading(true);
        await dispatch(toggleBackgroundEffect(options, _jitsiTrack));
        await setLoading(false);
        if (_localFlipX && options.backgroundType === VIRTUAL_BACKGROUND_TYPE.DESKTOP_SHARE) {
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
        dispatch(virtualBackgroundTrackChanged());
    }, [ dispatch, options, _localFlipX ]);

    // Prevent the selection of a new virtual background if it has not been applied by default
    const cancelVirtualBackground = useCallback(async () => {
        await setOptions({
            backgroundType: initialVirtualBackground.backgroundType,
            enabled: initialVirtualBackground.backgroundEffectEnabled,
            url: initialVirtualBackground.virtualSource,
            selectedThumbnail: initialVirtualBackground.selectedThumbnail,
            blurValue: initialVirtualBackground.blurValue
        });
        dispatch(hideDialog());
    });

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
            <VirtualBackgroundPreview
                loadedPreview = { loadedPreviewState }
                options = { options } />
            {loading ? (
                <div className = { classes.virtualBackgroundLoading }>
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
                        className = { clsx(classes.dialog, { [classes.dialogMarginTop]: previewIsLoaded }) }
                        role = 'radiogroup'
                        tabIndex = '-1'>
                        <Tooltip
                            content = { t('virtualBackground.removeBackground') }
                            position = { 'top' }>
                            <div
                                aria-checked = { _selectedThumbnail === 'none' }
                                aria-label = { t('virtualBackground.removeBackground') }
                                className = { clsx('background-option', 'virtual-background-none', {
                                    'none-selected': _selectedThumbnail === 'none'
                                }) }
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
                                className = { clsx('background-option', 'slight-blur', {
                                    'slight-blur-selected': _selectedThumbnail === 'slight-blur'
                                }) }
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
                                className = { clsx('background-option', 'blur', {
                                    'blur-selected': _selectedThumbnail === 'blur'
                                }) }
                                onClick = { enableBlur }
                                onKeyPress = { enableBlurKeyPress }
                                role = 'radio'
                                tabIndex = { 0 }>
                                {t('virtualBackground.blur')}
                            </div>
                        </Tooltip>
                        {!disableScreensharingVirtualBackground && (
                            <Tooltip
                                content = { t('virtualBackground.desktopShare') }
                                position = { 'top' }>
                                <div
                                    aria-checked = { _selectedThumbnail === 'desktop-share' }
                                    aria-label = { t('virtualBackground.desktopShare') }
                                    className = { clsx('background-option', 'desktop-share', {
                                        'desktop-share-selected': _selectedThumbnail === 'desktop-share'
                                    }) }
                                    onClick = { shareDesktop }
                                    onKeyPress = { shareDesktopKeyPress }
                                    role = 'radio'
                                    tabIndex = { 0 }>
                                    <Icon
                                        className = 'share-desktop-icon'
                                        size = { 30 }
                                        src = { IconShareDesktop } />
                                </div>
                            </Tooltip>
                        )}
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
                                    className = { clsx('background-option', {
                                        'thumbnail-selected': _selectedThumbnail === image.id,
                                        'thumbnail': _selectedThumbnail !== image.id
                                    }) }
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
