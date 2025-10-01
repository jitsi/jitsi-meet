import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { ColorPalette } from '../../../../base/styles/components/styles/ColorPalette';
import {
    getDeviceStatusText,
    getDeviceStatusType
} from '../../../functions';
import PermissionsGuideDialog from '../../PermissionsGuideDialog';

const useStyles = makeStyles<{ deviceStatusType?: string; }>()((theme, { deviceStatusType = 'pending' }) => {
    return {
        deviceStatus: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.typography.bodyShortRegular,
            color: '#fff',
            marginTop: theme.spacing(4),

            '& span': {
                marginLeft: theme.spacing(2)
            },

            '&.device-status-error': {
                alignItems: 'flex-start',
                backgroundColor: theme.palette.warning01,
                borderRadius: '6px',
                color: theme.palette.uiBackground,
                padding: '12px 16px',
                textAlign: 'left',
                marginTop: theme.spacing(2)
            },

            '@media (max-width: 720px)': {
                marginTop: 0
            }
        },
        indicator: {
            width: '16px',
            height: '16px',
            borderRadius: '100%',
            backgroundColor: deviceStatusType === 'ok' ? theme.palette.success01 : ColorPalette.darkGrey
        },
        helpButton: {
            marginTop: theme.spacing(4),
            marginLeft: '0',
            background: 'none',
            border: 'none',
            color: theme.palette.link01,
            cursor: 'pointer',
            padding: 0,
        }
    };
});

/**
 * Strip showing the current status of the devices.
 * User is informed if there are missing or malfunctioning devices.
 *
 * @returns {ReactElement}
 */
function DeviceStatus() {
    const { t } = useTranslation();
    const deviceStatusType = useSelector(getDeviceStatusType) as string | undefined;
    const deviceStatusText = useSelector(getDeviceStatusText);
    const { classes, cx } = useStyles({ deviceStatusType });
    const hasError = deviceStatusType === 'warning';
    const [ showGuide, setShowGuide ] = useState(false);
    const containerClassName = cx(classes.deviceStatus, { 'device-status-error': hasError });

    const handleOpenGuide = useCallback(() => {
        setShowGuide(true);
    }, []);

    const handleCloseGuide = useCallback(() => {
        setShowGuide(false);
    }, []);

    return (
        <>
            <div
                className = { containerClassName }
                role = 'alert'
                tabIndex = { -1 }>
                {!hasError && <div className = { classes.indicator } />}
                <span
                    aria-level = { 3 }
                    role = 'heading'>
                    {hasError ? t('prejoin.errorNoPermissions') : t(typeof deviceStatusText === 'string' ? deviceStatusText : '')}
                    {hasError && (
                        <span
                            className = { classes.helpButton }
                            onClick = { handleOpenGuide }>
                            {t('prejoin.permissionsGuide.needHelp')}
                        </span>
                    )}
                </span>
            </div>

            {showGuide && (
                <PermissionsGuideDialog onClose = { handleCloseGuide } />
            )}
        </>
    );
}

export default DeviceStatus;
