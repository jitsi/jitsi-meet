import React, { useCallback, useRef } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { hideDialog } from '../base/dialog/actions';
import { translate } from '../base/i18n/functions';
import Label from '../base/label/components/web/Label';
import Dialog from '../base/ui/components/web/Dialog';
const useStyles = makeStyles()({
    container: {
        display: 'flex',
        height: '100%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },

    hidden: {
        display: 'none'
    },
    label: {
        background: 'transparent',
    }
});

/**
 * The type of {@link CameraCaptureDialog}'s React {@code Component} props.
 */
interface IProps extends WithTranslation {
    /**
     * Callback function on file input changed.
     */
    callback: ({ error, dataURL }: { dataURL?: string; error?: string; }) => void;

    /**
     * Camera facing mode (environment/user).
     */
    cameraFacingMode?: string;
}

/**
 * Implements the Camera capture dialog.
 *
 * @param {Object} props - The props of the component.
 * @returns {React$Element}
 */
const CameraCaptureDialog = ({ callback, t, cameraFacingMode }: IProps) => {
    const dispatch = useDispatch();
    const { classes } = useStyles();
    const inputRef = useRef<HTMLInputElement>(null);
    const onCancel = useCallback(() => callback({
        error: 'User canceled!'
    }), []);

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
            cancel = {{ translationKey: 'dialog.cameraCaptureDialog.reject' }}
            disableAutoHideOnSubmit = { true }
            ok = {{ translationKey: 'dialog.cameraCaptureDialog.ok' }}
            onCancel = { onCancel }
            onSubmit = { onSubmit }
            titleKey = { t('dialog.cameraCaptureDialog.title') }>
            <div className = { classes.container } >
                <Label
                    aria-label = { t('dialog.cameraCaptureDialog.description') }
                    className = { classes.label }
                    text = { t('dialog.cameraCaptureDialog.description') } />
                <input
                    accept = 'image/*'
                    capture = { cameraFacingMode }
                    className = { classes.hidden }
                    onChange = { onInputChange }
                    ref = { inputRef }
                    type = 'file' />
            </div>
        </Dialog>
    );
};

export default translate(connect()(CameraCaptureDialog));
