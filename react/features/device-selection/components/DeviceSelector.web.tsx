import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { withPixelLineHeight } from '../../base/styles/functions.web';
import Select from '../../base/ui/components/web/Select';

/**
 * The type of the React {@code Component} props of {@link DeviceSelector}.
 */
interface IProps {

    /**
     * MediaDeviceInfos used for display in the select element.
     */
    devices: Array<MediaDeviceInfo> | undefined;

    /**
     * If false, will return a selector with no selection options.
     */
    hasPermission: boolean;

    /**
     * CSS class for the icon to the left of the dropdown trigger.
     */
    icon: string;

    /**
     * The id of the dropdown element.
     */
    id: string;

    /**
     * If true, will render the selector disabled with a default selection.
     */
    isDisabled: boolean;

    /**
     * The translation key to display as a menu label.
     */
    label: string;

    /**
     * The callback to invoke when a selection is made.
     */
    onSelect: Function;

    /**
     * The default device to display as selected.
     */
    selectedDeviceId: string;
}

const useStyles = makeStyles()(theme => {
    return {
        textSelector: {
            width: '100%',
            boxSizing: 'border-box',
            borderRadius: theme.shape.borderRadius,
            backgroundColor: theme.palette.uiBackground,
            padding: '10px 16px',
            textAlign: 'center',
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            border: `1px solid ${theme.palette.ui03}`
        }
    };
});

const DeviceSelector = ({
    devices,
    hasPermission,
    id,
    isDisabled,
    label,
    onSelect,
    selectedDeviceId
}: IProps) => {
    const { classes } = useStyles();
    const { t } = useTranslation();

    const _onSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const deviceId = e.target.value;

        if (selectedDeviceId !== deviceId) {
            onSelect(deviceId);
        }
    }, [ selectedDeviceId, onSelect ]);

    const _createDropdown = (options: {
        defaultSelected?: MediaDeviceInfo; isDisabled: boolean;
        items?: Array<{ label: string; value: string; }>; placeholder: string;
    }) => {
        const triggerText
            = (options.defaultSelected && (options.defaultSelected.label || options.defaultSelected.deviceId))
            || options.placeholder;

        if (options.isDisabled || !options.items?.length) {
            return (
                <div className = { classes.textSelector }>
                    {triggerText}
                </div>
            );
        }

        return (
            <Select
                id = { id }
                label = { t(label) }
                onChange = { _onSelect }
                options = { options.items }
                value = { selectedDeviceId } />
        );
    };

    const _renderNoDevices = () => _createDropdown({
        isDisabled: true,
        placeholder: t('settings.noDevice')
    });

    const _renderNoPermission = () => _createDropdown({
        isDisabled: true,
        placeholder: t('deviceSelection.noPermission')
    });

    if (hasPermission === undefined) {
        return null;
    }

    if (!hasPermission) {
        return _renderNoPermission();
    }

    if (!devices?.length) {
        return _renderNoDevices();
    }

    const items = devices.map(device => {
        return {
            value: device.deviceId,
            label: device.label || device.deviceId
        };
    });
    const defaultSelected = devices.find(item =>
        item.deviceId === selectedDeviceId
    );

    return _createDropdown({
        defaultSelected,
        isDisabled,
        items,
        placeholder: t('deviceSelection.selectADevice')
    });
};

export default DeviceSelector;
