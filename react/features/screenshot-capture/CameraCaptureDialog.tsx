import { Theme } from '@mui/material';
import React, { useCallback, useRef } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { hideDialog } from '../base/dialog/actions';
import { translate } from '../base/i18n/functions';
import Label from '../base/label/components/web/Label';
import { CAMERA_FACING_MODE } from '../base/media/constants';
import Button from '../base/ui/components/web/Button';
import Dialog from '../base/ui/components/web/Dialog';
import { BUTTON_TYPES } from '../base/ui/constants.any';

import { ICameraCapturePayload } from './actionTypes';

const useStyles = makeStyles()((theme: Theme) => ({
    container: {
        display: 'flex',
        height: '100%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: theme.spacing(3),
        textAlign: 'center'
    },
    buttonsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(3),
        width: '100%',
        maxWidth: '100%'
    },

    hidden: {
        display: 'none'
    },
    label: {
        background: 'transparent',
        margin: `${theme.spacing(3)} 0 ${theme.spacing(6)}`,
    },
    button: {
        width: '100%',
        height: '48px',
        maxWidth: '400px'
    }
}));

/**
 * The type of {@link CameraCaptureDialog}'s React {@code Component} props.
 */
interface IProps extends WithTranslation {
    /**
     * Callback function on file input changed.
     */
    callback: ({ error, dataURL }: { dataURL?: string; error?: string; }) => void;

    /**
     * The camera capture payload.
     */
    componentProps: ICameraCapturePayload;
}

/**
 * Implements the Camera capture dialog.
 *
 * @param {Object} props - The props of the component.
 * @returns {React$Element}
 */
const CameraCaptureDialog = ({
    callback,
    componentProps,
    t,
}: IProps) => {
    const { cameraFacingMode = CAMERA_FACING_MODE.ENVIRONMENT,
        descriptionText,
        titleText } = componentProps;
    const dispatch = useDispatch();
    const { classes } = useStyles();
    const inputRef = useRef<HTMLInputElement>(null);
    const onCancel = useCallback(() => {
        callback({
            error: 'User canceled!'
        });
        dispatch(hideDialog());
    }, []);

    const onSubmit = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const onInputChange = useCallback(event => {
        const reader = new FileReader();
        const files = event.target.files;

        if (!files?.[0]) {
            callback({
                error: 'No picture selected!'
            });

            return;
        }

        reader.onload = () => {
            callback({ dataURL: reader.result as string });
            dispatch(hideDialog());
        };
        reader.onerror = () => {
            callback({ error: 'Failed generating base64 URL!' });
            dispatch(hideDialog());
        };

        reader.readAsDataURL(files[0]);
    }, []);

    return (
        <Dialog
            cancel = {{ hidden: true }}
            disableAutoHideOnSubmit = { true }
            ok = {{ hidden: true }}
            onCancel = { onCancel }
            titleKey = { titleText || t('dialog.cameraCaptureDialog.title') }>
            <div className = { classes.container }>
                <Label
                    aria-label = { descriptionText || t('dialog.cameraCaptureDialog.description') }
                    className = { classes.label }
                    text = { descriptionText || t('dialog.cameraCaptureDialog.description') } />
                <div className = { classes.buttonsContainer } >
                    <Button
                        accessibilityLabel = { t('dialog.cameraCaptureDialog.ok') }
                        className = { classes.button }
                        labelKey = { 'dialog.cameraCaptureDialog.ok' }
                        onClick = { onSubmit } />
                    <Button
                        accessibilityLabel = { t('dialog.cameraCaptureDialog.reject') }
                        className = { classes.button }
                        labelKey = { 'dialog.cameraCaptureDialog.reject' }
                        onClick = { onCancel }
                        type = { BUTTON_TYPES.TERTIARY } />
                    <input
                        accept = 'image/*'
                        capture = { cameraFacingMode }
                        className = { classes.hidden }
                        onChange = { onInputChange }
                        ref = { inputRef }
                        type = 'file' />
                </div>
            </div>
        </Dialog>
    );
};

export default translate(connect()(CameraCaptureDialog));
