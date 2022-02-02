// @flow

import React from 'react';

import { translate } from '../../../base/i18n';
import { Icon, IconCheckSolid, IconExclamationTriangle } from '../../../base/icons';
import { connect } from '../../../base/redux';
import {
    getDeviceStatusType,
    getDeviceStatusText
} from '../../functions';

export type Props = {

    /**
     * The text to be displayed in relation to the status of the audio/video devices.
     */
    deviceStatusText: string,

    /**
     * The type of status for current devices, controlling the background color of the text.
     * Can be `ok` or `warning`.
     */
    deviceStatusType: string,

    /**
     * Used for translation.
     */
    t: Function
};

const iconMap = {
    warning: {
        src: IconExclamationTriangle,
        className: 'device-icon--warning'
    },
    ok: {
        src: IconCheckSolid,
        className: 'device-icon--ok'
    }
};

/**
 * Strip showing the current status of the devices.
 * User is informed if there are missing or malfunctioning devices.
 *
 * @returns {ReactElement}
 */
function DeviceStatus({ deviceStatusType, deviceStatusText, t }: Props) {
    const { src, className } = iconMap[deviceStatusType];
    const hasError = deviceStatusType === 'warning';
    const containerClassName = `device-status ${hasError ? 'device-status-error' : ''}`;

    return (
        <div
            className = { containerClassName }
            role = 'alert'
            tabIndex = { -1 }>
            <Icon
                className = { `device-icon ${className}` }
                size = { 16 }
                src = { src } />
            <span role = 'heading'>
                {hasError ? t('prejoin.errorNoPermissions') : t(deviceStatusText)}
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
function mapStateToProps(state) {
    return {
        deviceStatusText: getDeviceStatusText(state),
        deviceStatusType: getDeviceStatusType(state)
    };
}

export default translate(connect(mapStateToProps)(DeviceStatus));
