import React, { useCallback, useMemo, useState } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { hideDialog } from '../base/dialog/actions';
import { isMobileBrowser } from '../base/environment/utils';
import { translate } from '../base/i18n/functions';
import { CAMERA_FACING_MODE } from '../base/media/constants';
import { withPixelLineHeight } from '../base/styles/functions.web';
import Dialog from '../base/ui/components/web/Dialog';
import Select from '../base/ui/components/web/Select';

const FILE_INPUT_ID = 'captureCameraPictureInput';

const useStyles = makeStyles()(theme => {
    return {
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
            marginBottom: '16px',
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
    const isMobile = isMobileBrowser();
    const [ facingMode, setFacingMode ] = useState(cameraFacingMode || CAMERA_FACING_MODE.ENVIRONMENT);
    const titleTranslationKey = useMemo(() =>
        `dialog.cameraCaptureDialog.${isMobile ? 'captureTitle' : 'sendFileTitle'}`, []);
    const labelTranslationkKey = useMemo(() =>
        `dialog.cameraCaptureDialog.${isMobile ? 'captureLabel' : 'sendFileLabel'}`, []);
    const facingModeOptions = useMemo(() => Object.keys(CAMERA_FACING_MODE).map(key => (
        {
            value: CAMERA_FACING_MODE[key],
            label: t(`dialog.cameraCaptureDialog.${CAMERA_FACING_MODE[key]}`)
        })
    ), []);

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

    const onSelectChange = useCallback(event => setFacingMode(event.target.value), []);

    return (
        <Dialog
            ok = {{ hidden: true }}
            onCancel = { onCancel }
            titleKey = { t(titleTranslationKey) }>
            <div>
                <label
                    aria-label = { t(labelTranslationkKey) }
                    className = { classes.label }
                    htmlFor = { FILE_INPUT_ID }>
                    {t(labelTranslationkKey)}
                </label>
                <input
                    accept = 'image/*'
                    { ...isMobile ? { capture: facingMode } : {} }
                    className = { classes.hidden }
                    id = { FILE_INPUT_ID }
                    onChange = { onInputChange }
                    type = 'file' />
                {isMobile && (<div className = { classes.selectContainer }>
                    <Select
                        id = 'camera-facing-mode-select'
                        label = { t('dialog.cameraCaptureDialog.facingMode') }
                        onChange = { onSelectChange }
                        options = { facingModeOptions }
                        value = { facingMode } />
                </div>)
                }
            </div>
        </Dialog>
    );
};

export default translate(connect()(CameraCaptureDialog));
