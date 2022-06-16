// @flow

import { makeStyles } from '@material-ui/styles';
import React, { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { translate } from '../../base/i18n';
import { Icon, IconPlusCircle } from '../../base/icons';
import { VIRTUAL_BACKGROUND_TYPE, type Image } from '../constants';
import { resizeImage } from '../functions';
import logger from '../logger';

type Props = {

    /**
     * Callback used to set the 'loading' state of the parent component.
     */
    setLoading: Function,

    /**
     * Callback used to set the options.
     */
    setOptions: Function,

    /**
     * Callback used to set the storedImages array.
     */
    setStoredImages: Function,

    /**
     * A list of images locally stored.
     */
    storedImages: Array<Image>,

    /**
     * If a label should be displayed alongside the button.
     */
    showLabel: boolean,

    /**
     * Used for translation.
     */
    t: Function
}

const useStyles = makeStyles(theme => {
    return {
        addBackground: {
            marginRight: `${theme.spacing(2)}px`
        },
        button: {
            display: 'none'
        },
        label: {
            fontSize: '14px',
            fontWeight: '600',
            lineHeight: '20px',
            marginLeft: '-10px',
            marginTop: `${theme.spacing(3)}px`,
            marginBottom: `${theme.spacing(2)}px`,
            color: '#669aec',
            display: 'inline-flex',
            cursor: 'pointer'
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
    setLoading,
    setOptions,
    setStoredImages,
    showLabel,
    storedImages,
    t
}: Props) {
    const classes = useStyles();
    const uploadImageButton: Object = useRef(null);
    const uploadImageKeyPress = useCallback(e => {
        if (uploadImageButton.current && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            uploadImageButton.current.click();
        }
    }, [ uploadImageButton.current ]);


    const uploadImage = useCallback(async e => {
        const reader = new FileReader();
        const imageFile = e.target.files;

        reader.readAsDataURL(imageFile[0]);
        reader.onload = async () => {
            const url = await resizeImage(reader.result);
            const uuId = uuidv4();

            setStoredImages([
                ...storedImages,
                {
                    id: uuId,
                    src: url
                }
            ]);
            setOptions({
                backgroundType: VIRTUAL_BACKGROUND_TYPE.IMAGE,
                enabled: true,
                url,
                selectedThumbnail: uuId
            });
        };
        logger.info('New virtual background image uploaded!');

        reader.onerror = () => {
            setLoading(false);
            logger.error('Failed to upload virtual image!');
        };
    }, [ storedImages ]);

    return (
        <>
            {showLabel && <label
                aria-label = { t('virtualBackground.uploadImage') }
                className = { classes.label }
                htmlFor = 'file-upload'
                onKeyPress = { uploadImageKeyPress }
                tabIndex = { 0 } >
                <Icon
                    className = { classes.addBackground }
                    size = { 20 }
                    src = { IconPlusCircle } />
                {t('virtualBackground.addBackground')}
            </label>}

            <input
                accept = 'image/*'
                className = { classes.button }
                id = 'file-upload'
                onChange = { uploadImage }
                ref = { uploadImageButton }
                type = 'file' />
        </>
    );
}

export default translate(UploadImageButton);
