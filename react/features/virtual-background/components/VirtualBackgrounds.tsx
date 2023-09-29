// @ts-ignore
import { jitsiLocalStorage } from '@jitsi/js-utils/jitsi-local-storage';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { safeJsonParse } from '@jitsi/js-utils/json';
import React, { useCallback, useEffect, useState } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../app/types';
import { getMultipleVideoSendingSupportFeatureFlag } from '../../base/config/functions.any';
import { translate } from '../../base/i18n/functions';
import Icon from '../../base/icons/components/Icon';
import { IconCloseLarge } from '../../base/icons/svg';
import { withPixelLineHeight } from '../../base/styles/functions.web';
import Tooltip from '../../base/tooltip/components/Tooltip';
import Spinner from '../../base/ui/components/web/Spinner';
import { BACKGROUNDS_LIMIT, IMAGES, type Image, VIRTUAL_BACKGROUND_TYPE } from '../constants';
import { toDataURL } from '../functions';
import logger from '../logger';
import { IVirtualBackground } from '../reducer';

import UploadImageButton from './UploadImageButton';
import VirtualBackgroundPreview from './VirtualBackgroundPreview';
/* eslint-enable lines-around-comment */

interface IProps extends WithTranslation {

    /**
     * The list of Images to choose from.
     */
    _images: Array<Image>;

    /**
    * Whether or not multi-stream send support is enabled.
    */
    _multiStreamModeEnabled: boolean;

    /**
     * If the upload button should be displayed or not.
     */
    _showUploadButton: boolean;

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Options change handler.
     */
    onOptionsChange: Function;

    /**
     * Virtual background options.
     */
    options: IVirtualBackground;

    /**
     * Returns the selected thumbnail identifier.
     */
    selectedThumbnail: string;

    /**
     * The id of the selected video device.
     */
    selectedVideoInputId: string;
}

const onError = (event: any) => {
    event.target.style.display = 'none';
};

const useStyles = makeStyles()(theme => {
    return {
        virtualBackgroundLoading: {
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '50px'
        },

        container: {
            width: '100%',
            display: 'flex',
            flexDirection: 'column'
        },

        thumbnailContainer: {
            width: '100%',
            display: 'inline-grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
            gap: theme.spacing(1),

            '@media (min-width: 608px) and (max-width: 712px)': {
                gridTemplateColumns: '1fr 1fr 1fr 1fr'
            },

            '@media (max-width: 607px)': {
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: theme.spacing(2)
            }
        },

        thumbnail: {
            height: '54px',
            width: '100%',
            borderRadius: '4px',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            ...withPixelLineHeight(theme.typography.labelBold),
            color: theme.palette.text01,
            objectFit: 'cover',

            [[ '&:hover', '&:focus' ] as any]: {
                opacity: 0.5,
                cursor: 'pointer',

                '& ~ .delete-image-icon': {
                    display: 'block'
                }
            },

            '@media (max-width: 607px)': {
                height: '70px'
            }
        },

        selectedThumbnail: {
            border: `2px solid ${theme.palette.action01Hover}`
        },

        noneThumbnail: {
            backgroundColor: theme.palette.ui04
        },

        slightBlur: {
            boxShadow: 'inset 0 0 12px #000000',
            background: '#a4a4a4'
        },

        blur: {
            boxShadow: 'inset 0 0 12px #000000',
            background: '#7e8287'
        },

        storedImageContainer: {
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',

            '&:focus-within .delete-image-container': {
                display: 'block'
            }
        },

        deleteImageIcon: {
            position: 'absolute',
            top: '3px',
            right: '3px',
            background: theme.palette.ui03,
            borderRadius: '3px',
            cursor: 'pointer',
            display: 'none',

            '@media (max-width: 607px)': {
                display: 'block',
                padding: '3px'
            },

            [[ '&:hover', '&:focus' ] as any]: {
                display: 'block'
            }
        }
    };
});

/**
 * Renders virtual background dialog.
 *
 * @returns {ReactElement}
 */
function VirtualBackgrounds({
    _images,
    _showUploadButton,
    onOptionsChange,
    options,
    selectedVideoInputId,
    t
}: IProps) {
    const { classes, cx } = useStyles();
    const [ previewIsLoaded, setPreviewIsLoaded ] = useState(false);
    const localImages = jitsiLocalStorage.getItem('virtualBackgrounds');
    const [ storedImages, setStoredImages ] = useState<Array<Image>>((localImages && safeJsonParse(localImages)) || []);
    const [ loading, setLoading ] = useState(false);

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
        onOptionsChange({
            backgroundEffectEnabled: true,
            backgroundType: VIRTUAL_BACKGROUND_TYPE.BLUR,
            blurValue: 25,
            selectedThumbnail: 'blur'
        });
        logger.info('"Blur" option set for virtual background preview!');

    }, []);

    const enableBlurKeyPress = useCallback(e => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            enableBlur();
        }
    }, [ enableBlur ]);

    const enableSlideBlur = useCallback(async () => {
        onOptionsChange({
            backgroundEffectEnabled: true,
            backgroundType: VIRTUAL_BACKGROUND_TYPE.BLUR,
            blurValue: 8,
            selectedThumbnail: 'slight-blur'
        });
        logger.info('"Slight-blur" option set for virtual background preview!');

    }, []);

    const enableSlideBlurKeyPress = useCallback(e => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            enableSlideBlur();
        }
    }, [ enableSlideBlur ]);

    const removeBackground = useCallback(async () => {
        onOptionsChange({
            backgroundEffectEnabled: false,
            selectedThumbnail: 'none'
        });
        logger.info('"None" option set for virtual background preview!');

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
            onOptionsChange({
                backgroundEffectEnabled: true,
                backgroundType: VIRTUAL_BACKGROUND_TYPE.IMAGE,
                selectedThumbnail: image.id,
                virtualSource: image.src
            });
            logger.info('Uploaded image set for virtual background preview!');
        }
    }, [ storedImages ]);

    const setImageBackground = useCallback(async e => {
        const imageId = e.currentTarget.getAttribute('data-imageid');
        const image = _images.find(img => img.id === imageId);

        if (image) {
            try {
                const url = await toDataURL(image.src);

                onOptionsChange({
                    backgroundEffectEnabled: true,
                    backgroundType: VIRTUAL_BACKGROUND_TYPE.IMAGE,
                    selectedThumbnail: image.id,
                    virtualSource: url
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

    const loadedPreviewState = useCallback(async loaded => {
        await setPreviewIsLoaded(loaded);
    }, []);

    // create a full list of {backgroundId: backgroundLabel} to easily retrieve label of selected background
    const labelsMap: Record<string, string> = {
        none: t('virtualBackground.none'),
        'slight-blur': t('virtualBackground.slightBlur'),
        blur: t('virtualBackground.blur'),
        ..._images.reduce<Record<string, string>>((acc, image) => {
            acc[image.id] = image.tooltip ? t(`virtualBackground.${image.tooltip}`) : '';

            return acc;
        }, {}),
        ...storedImages.reduce<Record<string, string>>((acc, image, index) => {
            acc[image.id] = t('virtualBackground.uploadedImage', { index: index + 1 });

            return acc;
        }, {})
    };
    const currentBackgroundLabel = options?.selectedThumbnail ? labelsMap[options.selectedThumbnail] : labelsMap.none;
    const isThumbnailSelected = useCallback(thumbnail => options?.selectedThumbnail === thumbnail, [ options ]);
    const getSelectedThumbnailClass = useCallback(
        thumbnail => isThumbnailSelected(thumbnail) && classes.selectedThumbnail, [ isThumbnailSelected, options ]
    );

    return (
        <>
            <VirtualBackgroundPreview
                loadedPreview = { loadedPreviewState }
                options = { options }
                selectedVideoInputId = { selectedVideoInputId } />
            {loading ? (
                <div className = { classes.virtualBackgroundLoading }>
                    <Spinner />
                </div>
            ) : (
                <div className = { classes.container }>
                    <span
                        className = 'sr-only'
                        id = 'virtual-background-current-info'>
                        { t('virtualBackground.accessibilityLabel.currentBackground', {
                            background: currentBackgroundLabel
                        }) }
                    </span>
                    {_showUploadButton
                    && <UploadImageButton
                        setLoading = { setLoading }
                        setOptions = { onOptionsChange }
                        setStoredImages = { setStoredImages }
                        showLabel = { previewIsLoaded }
                        storedImages = { storedImages } />}
                    <div
                        aria-describedby = 'virtual-background-current-info'
                        aria-label = { t('virtualBackground.accessibilityLabel.selectBackground') }
                        className = { classes.thumbnailContainer }
                        role = 'radiogroup'
                        tabIndex = { -1 }>
                        <Tooltip
                            content = { t('virtualBackground.removeBackground') }
                            position = { 'top' }>
                            <div
                                aria-checked = { isThumbnailSelected('none') }
                                aria-label = { t('virtualBackground.removeBackground') }
                                className = { cx(classes.thumbnail, classes.noneThumbnail,
                                    getSelectedThumbnailClass('none')) }
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
                                aria-checked = { isThumbnailSelected('slight-blur') }
                                aria-label = { t('virtualBackground.slightBlur') }
                                className = { cx(classes.thumbnail, classes.slightBlur,
                                    getSelectedThumbnailClass('slight-blur')) }
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
                                aria-checked = { isThumbnailSelected('blur') }
                                aria-label = { t('virtualBackground.blur') }
                                className = { cx(classes.thumbnail, classes.blur,
                                    getSelectedThumbnailClass('blur')) }
                                onClick = { enableBlur }
                                onKeyPress = { enableBlurKeyPress }
                                role = 'radio'
                                tabIndex = { 0 }>
                                {t('virtualBackground.blur')}
                            </div>
                        </Tooltip>
                        {_images.map(image => (
                            <Tooltip
                                content = { (image.tooltip && t(`virtualBackground.${image.tooltip}`)) ?? '' }
                                key = { image.id }
                                position = { 'top' }>
                                <img
                                    alt = { image.tooltip && t(`virtualBackground.${image.tooltip}`) }
                                    aria-checked = { isThumbnailSelected(image.id) }
                                    className = { cx(classes.thumbnail,
                                        getSelectedThumbnailClass(image.id)) }
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
                                className = { classes.storedImageContainer }
                                key = { image.id }>
                                <img
                                    alt = { t('virtualBackground.uploadedImage', { index: index + 1 }) }
                                    aria-checked = { isThumbnailSelected(image.id) }
                                    className = { cx(classes.thumbnail,
                                        getSelectedThumbnailClass(image.id)) }
                                    data-imageid = { image.id }
                                    onClick = { setUploadedImageBackground }
                                    onError = { onError }
                                    onKeyPress = { setUploadedImageBackgroundKeyPress }
                                    role = 'radio'
                                    src = { image.src }
                                    tabIndex = { 0 } />

                                <Icon
                                    ariaLabel = { t('virtualBackground.deleteImage') }
                                    className = { cx(classes.deleteImageIcon, 'delete-image-icon') }
                                    data-imageid = { image.id }
                                    onClick = { deleteStoredImage }
                                    onKeyPress = { deleteStoredImageKeyPress }
                                    role = 'button'
                                    size = { 16 }
                                    src = { IconCloseLarge }
                                    tabIndex = { 0 } />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
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
function _mapStateToProps(state: IReduxState) {
    const dynamicBrandingImages = state['features/dynamic-branding'].virtualBackgrounds;
    const hasBrandingImages = Boolean(dynamicBrandingImages.length);

    return {
        _images: (hasBrandingImages && dynamicBrandingImages) || IMAGES,
        _showUploadButton: !state['features/base/config'].disableAddingBackgroundImages,
        _multiStreamModeEnabled: getMultipleVideoSendingSupportFeatureFlag(state)
    };
}

export default connect(_mapStateToProps)(translate(VirtualBackgrounds));
