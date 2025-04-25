import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { ColorPalette } from '../../../../base/styles/components/styles/ColorPalette';
import { withPixelLineHeight } from '../../../../base/styles/functions.web';
import {
    getDeviceStatusText,
    getDeviceStatusType
} from '../../../functions';

const useStyles = makeStyles<{ deviceStatusType?: string; }>()((theme, { deviceStatusType = 'pending' }) => {
    return {
        deviceStatus: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            color: '#fff',
            marginTop: theme.spacing(4),

            '& span': {
                marginLeft: theme.spacing(3)
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
    const deviceStatusType = useSelector(getDeviceStatusType);
    const deviceStatusText = useSelector(getDeviceStatusText);
    const { classes, cx } = useStyles({ deviceStatusType });
    const hasError = deviceStatusType === 'warning';
    const containerClassName = cx(classes.deviceStatus, { 'device-status-error': hasError });

    return (
        <div
            className = { containerClassName }
            role = 'alert'
            tabIndex = { -1 }>
            {!hasError && <div className = { classes.indicator } />}
            <span
                aria-level = { 3 }
                role = 'heading'>
                {hasError ? t('prejoin.errorNoPermissions') : t(deviceStatusText ?? '')}
            </span>
        </div>
    );
}

export default DeviceStatus;
