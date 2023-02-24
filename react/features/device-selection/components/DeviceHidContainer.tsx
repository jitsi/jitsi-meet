import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import Button from '../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../base/ui/constants.any';
import { requestHidDevice } from '../../web-hid/actions.web';
import {
    getDeviceInfo,
    shouldRequestHIDDevice
} from '../../web-hid/functions.web';

const useStyles = makeStyles()(() => {
    return {
        callControlContainer: {
            fontSize: '14px',
            '> label': {
                display: 'block',
                marginBottom: '20px'
            }
        },

        hidContainer: {
            '> span': {
                marginLeft: '16px'
            }
        }
    };
});

/**
 * Device hid container.
 *
 * @param {IProps} props - The props of the component.
 * @returns {*}
 */
function DeviceHidContainer() {
    const { t } = useTranslation();
    const deviceInfo = useSelector(getDeviceInfo);
    const showRequestDeviceInfo = shouldRequestHIDDevice(deviceInfo);
    const { classes: styles, cx } = useStyles();
    const dispatch = useDispatch();

    const onRequestControl = useCallback(() => {
        dispatch(requestHidDevice());
    }, [ dispatch ]);

    return (
        <div
            className = { cx(styles.callControlContainer) }
            key = 'callControl'>
            <label
                className = 'device-selector-label'
                htmlFor = 'callControl'>
                {t('deviceSelection.hid.callControl')}
            </label>
            {showRequestDeviceInfo && (
                <Button
                    accessibilityLabel = { 'Request control button' }
                    id = 'request-control-btn'
                    key = 'request-control-btn'
                    label = { 'Connect device' }
                    onClick = { onRequestControl }
                    size = 'small'
                    type = { BUTTON_TYPES.SECONDARY } />
            )}
            {!showRequestDeviceInfo && (
                <div className = { cx(styles.hidContainer) }>
                    <p>{t('deviceSelection.hid.connectedDevices')}</p>
                    <span>{deviceInfo.productName}</span>
                </div>
            )}
        </div>
    );
}

export default DeviceHidContainer;
