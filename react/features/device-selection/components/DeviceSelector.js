import AKButton from '@atlaskit/button';
import AKDropdownMenu from '@atlaskit/dropdown-menu';
import ExpandIcon from '@atlaskit/icon/glyph/expand';
import React, { Component } from 'react';

import { translate } from '../../base/i18n';

const EXPAND_ICON = <ExpandIcon label = 'expand' />;

/**
 * React component for selecting a device from a select element. Wraps
 * AKDropdownMenu with device selection specific logic.
 *
 * @extends Component
 */
class DeviceSelector extends Component {
    /**
     * DeviceSelector component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * MediaDeviceInfos used for display in the select element.
         */
        devices: React.PropTypes.array,

        /**
         * If false, will return a selector with no selection options.
         */
        hasPermission: React.PropTypes.bool,

        /**
         * CSS class for the icon to the left of the dropdown trigger.
         */
        icon: React.PropTypes.string,

        /**
         * If true, will render the selector disabled with a default selection.
         */
        isDisabled: React.PropTypes.bool,

        /**
         * The translation key to display as a menu label.
         */
        label: React.PropTypes.string,

        /**
         * The callback to invoke when a selection is made.
         */
        onSelect: React.PropTypes.func,

        /**
         * The default device to display as selected.
         */
        selectedDeviceId: React.PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    }

    /**
     * Initializes a new DeviceSelector instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._onSelect = this._onSelect.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (!this.props.hasPermission) {
            return this._renderNoPermission();
        }

        if (!this.props.devices.length) {
            return this._renderNoDevices();
        }

        const items = this.props.devices.map(this._createDropdownItem);
        const defaultSelected = items.find(item =>
            item.value === this.props.selectedDeviceId
        );

        return this._createDropdown({
            defaultSelected,
            isDisabled: this.props.isDisabled,
            items,
            placeholder: 'deviceSelection.selectADevice'
        });
    }

    /**
     * Creates an AtlasKit Button.
     *
     * @param {string} buttonText - The text to display within the button.
     * @private
     * @returns {ReactElement}
     */
    _createDropdownTrigger(buttonText) {
        return (
            <AKButton
                className = 'device-selector-trigger'
                iconAfter = { EXPAND_ICON }
                iconBefore = { this._createDropdownIcon() }>
                { buttonText }
            </AKButton>
        );
    }

    /**
     * Creates a ReactComponent for displaying an icon.
     *
     * @private
     * @returns {ReactElement}
     */
    _createDropdownIcon() {
        return (
            <span className = { `device-selector-icon ${this.props.icon}` } />
        );
    }

    /**
     * Creates an object in the format expected by AKDropdownMenu for an option.
     *
     * @param {MediaDeviceInfo} device - An object with a label and a deviceId.
     * @private
     * @returns {Object} The passed in media device description converted to a
     * format recognized as a valid AKDropdownMenu item.
     */
    _createDropdownItem(device) {
        return {
            content: device.label,
            value: device.deviceId
        };
    }

    /**
     * Creates a AKDropdownMenu Component using passed in props and options.
     *
     * @param {Object} options - Additional configuration for display.
     * @param {Object} options.defaultSelected - The option that should be set
     * as currently chosen.
     * @param {boolean} options.isDisabled - If true, AKDropdownMenu will not
     * open on click.
     * @param {Array} options.items - All the selectable options to display.
     * @param {string} options.placeholder - The translation key to display when
     * no selection has been made.
     * @private
     * @returns {ReactElement}
     */
    _createDropdown(options) {
        const triggerText
            = (options.defaultSelected && options.defaultSelected.content)
                || options.placeholder;

        return (
            <AKDropdownMenu
                { ...(options.isDisabled && { isOpen: !options.isDisabled }) }
                items = { [ { items: options.items || [] } ] }
                noMatchesFound
                    = { this.props.t('deviceSelection.noOtherDevices') }
                onItemActivated = { this._onSelect }>
                { this._createDropdownTrigger(triggerText) }
            </AKDropdownMenu>
        );
    }

    /**
     * Invokes the passed in callback to notify of selection changes.
     *
     * @param {Object} selection - Event from choosing a AKDropdownMenu option.
     * @private
     * @returns {void}
     */
    _onSelect(selection) {
        const newDeviceId = selection.item.value;

        if (this.props.selectedDeviceId !== newDeviceId) {
            this.props.onSelect(selection.item.value);
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
            placeholder: this.props.t('settings.noPermission')
        });
    }
}

export default translate(DeviceSelector);
