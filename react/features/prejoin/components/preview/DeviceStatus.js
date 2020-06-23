// @flow

import React from 'react';

import { translate } from '../../../base/i18n';
import { Icon, IconCheck, IconExclamation } from '../../../base/icons';
import { connect } from '../../../base/redux';
import {
    getDeviceStatusType,
    getDeviceStatusText,
    getRawError
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
     * The error coming from device configuration.
     */
    rawError: string,

    /**
     * Used for translation.
     */
    t: Function
};

const iconMap = {
    warning: {
        src: IconExclamation,
        className: 'prejoin-preview-status--warning'
    },
    ok: {
        src: IconCheck,
        className: 'prejoin-preview-status--ok'
    }
};

/**
 * Strip showing the current status of the devices.
 * User is informed if there are missing or malfunctioning devices.
 *
 * @returns {ReactElement}
 */
function DeviceStatus({ deviceStatusType, deviceStatusText, rawError, t }: Props) {
    const { src, className } = iconMap[deviceStatusType];

    return (
        <div className = { `prejoin-preview-status ${className}` }>
            <Icon
                className = 'prejoin-preview-icon'
                size = { 16 }
                src = { src } />
            <span className = 'prejoin-preview-error-desc'>{t(deviceStatusText)}</span>
            { rawError && <span>
                { rawError }
            </span> }
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
        deviceStatusType: getDeviceStatusType(state),
        rawError: getRawError(state)
    };
}

export default translate(connect(mapStateToProps)(DeviceStatus));
