import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { translate } from '../../base/i18n/functions';
import { withPixelLineHeight } from '../../base/styles/functions.web';
import Select from '../../base/ui/components/web/Select';

/**
 * The type of the React {@code Component} props of {@link DeviceSelector}.
 */
interface IProps extends WithTranslation {

    /**
     * CSS classes object.
     */
    classes: any;

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

const styles = (theme: Theme) => {
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
};

/**
 * React component for selecting a device from a select element. Wraps
 * AKDropdownMenu with device selection specific logic.
 *
 * @augments Component
 */
class DeviceSelector extends Component<IProps> {
    /**
     * Initializes a new DeviceSelector instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        this._onSelect = this._onSelect.bind(this);
        this._createDropdown = this._createDropdown.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (this.props.hasPermission === undefined) {
            return null;
        }

        if (!this.props.hasPermission) {
            return this._renderNoPermission();
        }

        if (!this.props.devices || !this.props.devices.length) {
            return this._renderNoDevices();
        }

        const items = this.props.devices.map(device => {
            return {
                value: device.deviceId,
                label: device.label || device.deviceId
            };
        });
        const defaultSelected = this.props.devices.find(item =>
            item.deviceId === this.props.selectedDeviceId
        );

        return this._createDropdown({
            defaultSelected,
            isDisabled: this.props.isDisabled,
            items,
            placeholder: this.props.t('deviceSelection.selectADevice')
        });
    }

    /**
     * Creates a AKDropdownMenu Component using passed in props and options. If
     * the dropdown needs to be disabled, then only the AKDropdownMenu trigger
     * element is returned to simulate a disabled state.
     *
     * @param {Object} options - Additional configuration for display.
     * @param {Object} options.defaultSelected - The option that should be set
     * as currently chosen.
     * @param {boolean} options.isDisabled - If true, only the AKDropdownMenu
     * trigger component will be returned to simulate a disabled dropdown.
     * @param {Array} options.items - All the selectable options to display.
     * @param {string} options.placeholder - The translation key to display when
     * no selection has been made.
     * @private
     * @returns {ReactElement}
     */
    _createDropdown(options: { defaultSelected?: MediaDeviceInfo; isDisabled: boolean;
        items?: Array<{ label: string; value: string; }>; placeholder: string; }) {
        const triggerText
            = (options.defaultSelected && (options.defaultSelected.label || options.defaultSelected.deviceId))
                || options.placeholder;
        const { classes } = this.props;

        if (options.isDisabled || !options.items?.length) {
            return (
                <div className = { classes.textSelector }>
                    {triggerText}
                </div>
            );
        }

        return (
            <Select
                label = { this.props.t(this.props.label) }
                onChange = { this._onSelect }
                options = { options.items }
                value = { this.props.selectedDeviceId } />
        );
    }

    /**
     * Invokes the passed in callback to notify of selection changes.
     *
     * @param {Object} e - The key event to handle.
     *
     * @private
     * @returns {void}
     */
    _onSelect(e: React.ChangeEvent<HTMLSelectElement>) {
        const deviceId = e.target.value;

        if (this.props.selectedDeviceId !== deviceId) {
            this.props.onSelect(deviceId);
        }
    }

    /**
     * Creates a Select Component that is disabled and has a placeholder
     * indicating there are no devices to select.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderNoDevices() {
        return this._createDropdown({
            isDisabled: true,
            placeholder: this.props.t('settings.noDevice')
        });
    }

    /**
     * Creates a AKDropdownMenu Component that is disabled and has a placeholder
     * stating there is no permission to display the devices.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderNoPermission() {
        return this._createDropdown({
            isDisabled: true,
            placeholder: this.props.t('deviceSelection.noPermission')
        });
    }
}

export default withStyles(styles)(translate(DeviceSelector));
