import React, { useCallback, useRef } from 'react';
import { WithTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';
import { v4 as uuidv4 } from 'uuid';

import { IStore } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import Icon from '../../base/icons/components/Icon';
import { IconPlus } from '../../base/icons/svg';
import { setVirtualBackground, toggleBackgroundEffect } from '../actions';
import { type Image, VIRTUAL_BACKGROUND_TYPE } from '../constants';
import { resizeImage } from '../functions';
import logger from '../logger';

import VirtualBackgroundFramingDialog from './VirtualBackgroundFramingDialog';

interface IProps extends WithTranslation {

    /**
     * Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * The local video track.
     */
    localVideoTrack: any;

    /**
     * Callback used to set the 'loading' state of the parent component.
     */
    setLoading: Function;

    /**
     * Callback used to set the options.
     */
    setOptions: Function;

    /**
     * Callback used to set the storedImages array.
     */
    setStoredImages: Function;

    /**
     * If a label should be displayed alongside the button.
     */
    showLabel: boolean;

    /**
     * A list of images locally stored.
     */
    storedImages: Array<Image>;
}

const useStyles = makeStyles()(theme => {
    return {
        label: {
            ...theme.typography.bodyShortBold,
            color: theme.palette.link01,
            marginBottom: theme.spacing(3),
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
        },

        addBackground: {
            marginRight: theme.spacing(3),

            '& svg': {
                fill: `${theme.palette.link01} !important`
            }
        },

        input: {
            display: 'none'
        }
    };
});

/**
 * Component used to upload an image.
 *
 * @param {Object} Props - The props of the component.
 * @returns {React$Node}
 */
function UploadImageButton({
    dispatch,
    localVideoTrack,
    setLoading,
    setOptions,
    setStoredImages,
    showLabel,
    storedImages,
    t
}: IProps) {
    const { classes } = useStyles();
    const [ rawImage, setRawImage ] = React.useState<string | null>(null);
    const uploadImageButton = useRef<HTMLInputElement>(null);
    const uploadImageKeyPress = useCallback(e => {
        if (uploadImageButton.current && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            uploadImageButton.current.click();
        }
    }, [ uploadImageButton.current ]);


    const uploadImage = useCallback(async e => {
        const imageFile = e.target.files;

        if (imageFile.length === 0) {
            return;
        }

        const reader = new FileReader();

        reader.readAsDataURL(imageFile[0]);
        reader.onload = async () => {
            setRawImage(reader.result as string);
        };
        logger.info('New virtual background image uploaded!');

        reader.onerror = () => {
            setLoading(false);
            logger.error('Failed to upload virtual image!');
        };
    }, [ storedImages ]);

    const onFramingSuccess = useCallback((url: string) => {
        const uuId = uuidv4();
        const options = {
            backgroundEffectEnabled: true,
            backgroundType: VIRTUAL_BACKGROUND_TYPE.IMAGE,
            selectedThumbnail: uuId,
            virtualSource: url
        };

        setStoredImages([
            ...storedImages,
            {
                id: uuId,
                src: url
            }
        ]);
        setOptions(options);

        // Sync with global meeting background instantly
        dispatch(toggleBackgroundEffect(options, localVideoTrack));

        setRawImage(null);
    }, [ storedImages, setStoredImages, setOptions, dispatch, localVideoTrack ]);

    const onFramingClose = useCallback(() => {
        setRawImage(null);
        setLoading(false);
    }, [ setLoading ]);

    // Retrieve the active track's dimensions to calculate the aspect ratio.
    // We use optional chaining and fallbacks to prevent crashes if the track is not yet initialized.
    const { width, height } = localVideoTrack?.getSettings?.() || localVideoTrack?.getConstraints?.() || {};
    const trackRatio = (width && height) ? width / height : 16 / 9;

    return (
        <>
            {showLabel && <label
                className = { classes.label }
                htmlFor = 'file-upload'
                onKeyPress = { uploadImageKeyPress }
                tabIndex = { 0 } >
                <Icon
                    className = { classes.addBackground }
                    size = { 24 }
                    src = { IconPlus } />
                {t('virtualBackground.addBackground')}
            </label>}

            <input
                accept = 'image/*'
                className = { classes.input }
                id = 'file-upload'
                onChange = { uploadImage }
                ref = { uploadImageButton }
                role = 'button'
                type = 'file' />
            {rawImage && (
                <VirtualBackgroundFramingDialog
                    image = { rawImage }
                    onClose = { onFramingClose }
                    onSuccess = { onFramingSuccess }
                    ratio = { trackRatio } />
            )}
        </>
    );
}

export default translate(UploadImageButton);
