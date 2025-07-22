import React, { useCallback } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { hideDialog } from '../base/dialog/actions';
import { translate } from '../base/i18n/functions';
import { withPixelLineHeight } from '../base/styles/functions.web';
import Dialog from '../base/ui/components/web/Dialog';

const FILE_INPUT_ID = 'captureCameraPictureInput';

const useStyles = makeStyles()(theme => {
    return {
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
            background: theme.palette.action02,
            color: theme.palette.text04,
            ...withPixelLineHeight(theme.typography.bodyLongBold),
            borderRadius: theme.shape.borderRadius,
            boxSizing: 'border-box',
            cursor: 'pointer',
            display: 'inline-block',
            padding: '7px 16px',
            position: 'relative' as const,
            textAlign: 'center',
            border: 0,

            '&:hover': {
                backgroundColor: theme.palette.action02Hover
            }
        },
        selectContainer: {
            marginBottom: '8px'
        }
    };
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

    const onCancel = useCallback(() => callback({
        error: 'User canceled!'
    }), []);

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
            ok = {{ hidden: true }}
            onCancel = { onCancel }
            titleKey = { t('dialog.cameraCaptureDialog.captureTitle') }>
            <div className = { classes.container } >
                <label
                    aria-label = { t('dialog.cameraCaptureDialog.captureLabel') }
                    className = { classes.label }
                    htmlFor = { FILE_INPUT_ID }>
                    {t('dialog.cameraCaptureDialog.captureLabel')}
                </label>
                <input
                    accept = 'image/*'
                    capture = { cameraFacingMode }
                    className = { classes.hidden }
                    id = { FILE_INPUT_ID }
                    onChange = { onInputChange }
                    type = 'file' />
            </div>
        </Dialog>
    );
};

export default translate(connect()(CameraCaptureDialog));
