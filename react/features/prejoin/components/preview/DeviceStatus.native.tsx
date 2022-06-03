import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { translate } from '../../../base/i18n';
import { Icon, IconCheckSolid, IconExclamationTriangle } from '../../../base/icons';
import { connect } from '../../../base/redux';
import styles from '../styles';


interface Props {
    deviceStatusText: string;
    deviceStatusType: string;
}

const DeviceStatus = ({ deviceStatusType, deviceStatusText }: Props) => {
    const { t } = useTranslation();
    const hasError = deviceStatusType === 'warning';
    const errorStyle = deviceStatusType === 'warning' && styles.deviceStatusError;

    return (
        <View
            style = { [
                styles.deviceStatus,
                errorStyle
            ] } >
            <Icon
                size = { 16 }
                src = { hasError ? IconExclamationTriangle : IconCheckSolid } />
            <Text style = { styles.statusMessage }>
                { hasError ? t('prejoin.errorNoPermissions') : t(deviceStatusText)}
            </Text>
        </View>
    );
};

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {any} state - The redux state.
 * @returns {{ deviceStatusText: string, deviceStatusText: string }}
 */
function mapStateToProps(state: any) {
    return {
        deviceStatusText: state['features/prejoin']?.deviceStatusText,
        deviceStatusType: state['features/prejoin']?.deviceStatusType
    };
}

export default translate(connect(mapStateToProps)(DeviceStatus));
