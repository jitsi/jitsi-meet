import React from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../../app/types';
import { translate } from '../../../../base/i18n/functions';
import { withPixelLineHeight } from '../../../../base/styles/functions.web';
import {
    getDeviceStatusText,
    getDeviceStatusType
} from '../../../functions';

export interface IProps extends WithTranslation {

    /**
     * The text to be displayed in relation to the status of the audio/video devices.
     */
    deviceStatusText?: string;

    /**
     * The type of status for current devices, controlling the background color of the text.
     * Can be `ok` or `warning`.
     */
    deviceStatusType?: string;
}

const useStyles = makeStyles()(theme => {
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
            backgroundColor: theme.palette.success01
        }
    };
});

/**
 * Strip showing the current status of the devices.
 * User is informed if there are missing or malfunctioning devices.
 *
 * @returns {ReactElement}
 */
function DeviceStatus({ deviceStatusType, deviceStatusText, t }: IProps) {
    const { classes, cx } = useStyles();
    const hasError = deviceStatusType === 'warning';
    const containerClassName = cx(classes.deviceStatus, { 'device-status-error': hasError });

    return (
        <div
            className = { containerClassName }
            role = 'alert'
            tabIndex = { -1 }>
            {!hasError && <div className = { classes.indicator } />}
            <span role = 'heading'>
                {hasError ? t('prejoin.errorNoPermissions') : t(deviceStatusText ?? '')}
            </span>
        </div>
    );
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @returns {{ deviceStatusText: string, deviceStatusText: string }}
 */
function mapStateToProps(state: IReduxState) {
    return {
        deviceStatusText: getDeviceStatusText(state),
        deviceStatusType: getDeviceStatusType(state)
    };
}

export default translate(connect(mapStateToProps)(DeviceStatus));
