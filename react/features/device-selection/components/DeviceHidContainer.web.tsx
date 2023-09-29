import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../base/icons/components/Icon';
import { IconTrash } from '../../base/icons/svg';
import { withPixelLineHeight } from '../../base/styles/functions.web';
import Button from '../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../base/ui/constants.any';
import { closeHidDevice, requestHidDevice } from '../../web-hid/actions';
import { getDeviceInfo, shouldRequestHIDDevice } from '../../web-hid/functions';

const useStyles = makeStyles()(theme => {
    return {
        callControlContainer: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start'
        },

        label: {
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            color: theme.palette.text01,
            marginBottom: theme.spacing(2)
        },

        deviceRow: {
            display: 'flex',
            justifyContent: 'space-between'
        },

        deleteDevice: {
            cursor: 'pointer',
            textAlign: 'center'
        },

        headerConnectedDevice: {
            fontWeight: 600
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
 * @returns {ReactElement}
 */
function DeviceHidContainer() {
    const { t } = useTranslation();
    const deviceInfo = useSelector(getDeviceInfo);
    const showRequestDeviceInfo = shouldRequestHIDDevice(deviceInfo);
    const { classes } = useStyles();
    const dispatch = useDispatch();

    const onRequestControl = useCallback(() => {
        dispatch(requestHidDevice());
    }, [ dispatch ]);

    const onDeleteHid = useCallback(() => {
        dispatch(closeHidDevice());
    }, [ dispatch ]);

    return (
        <div
            className = { classes.callControlContainer }
            key = 'callControl'>
            <label
                className = { classes.label }
                htmlFor = 'callControl'>
                {t('deviceSelection.hid.callControl')}
            </label>
            {showRequestDeviceInfo && (
                <Button
                    accessibilityLabel = { t('deviceSelection.hid.pairDevice') }
                    id = 'request-control-btn'
                    key = 'request-control-btn'
                    label = { t('deviceSelection.hid.pairDevice') }
                    onClick = { onRequestControl }
                    type = { BUTTON_TYPES.SECONDARY } />
            )}
            {!showRequestDeviceInfo && (
                <div className = { classes.hidContainer }>
                    <p className = { classes.headerConnectedDevice }>{t('deviceSelection.hid.connectedDevices')}</p>
                    <div className = { classes.deviceRow }>
                        <span>{deviceInfo.device?.productName}</span>
                        <Icon
                            ariaLabel = { t('deviceSelection.hid.deleteDevice') }
                            className = { classes.deleteDevice }
                            onClick = { onDeleteHid }
                            role = 'button'
                            src = { IconTrash }
                            tabIndex = { 0 } />
                    </div>
                </div>
            )}
        </div>
    );
}

export default DeviceHidContainer;
