import AKDropdownMenu from '@atlaskit/dropdown-menu';
import ExpandIcon from '@atlaskit/icon/glyph/expand';
import React, { Component } from 'react';

import { translate } from '../../base/i18n';

const EXPAND_ICON = <ExpandIcon label = 'expand' />;

/**
 * React {@code Component} for selecting a device from a dropdwn. Wraps
 * {@code AKDropdownMenu} with device selection specific logic.
 *
 * @extends Component
 */
class DeviceSelector extends Component {
    /**
     * {@code DeviceSelector}'s property types.
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
    };

    /**
     * Initializes a new DeviceSelector instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
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
            placeholder: this.props.t('deviceSelection.selectADevice')
        });
    }

    /**
     * Creates a ReactElement for displaying the passed in text surrounded by
     * two icons. The left icon is the icon class passed in through props and
     * the right icon is AtlasKit {@code ExpandIcon}.
     *
     * @param {string} triggerText - The text to display within the element.
     * @private
     * @returns {ReactElement}
     */
    _createDropdownTrigger(triggerText) {
        return (
            <div className = 'device-selector-trigger'>
                <span
                    className = { `device-selector-icon ${this.props.icon}` } />
                <span className = 'device-selector-trigger-text'>
                    { triggerText }
                </span>
                { EXPAND_ICON }
            </div>
        );
    }

    /**
     * Creates an object in the format expected by {@code AKDropdownMenu} for a
     * dropdown option.
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
     * Creates an instance of {@code AKDropdownMenu} using props and passed in
     * options. If the dropdown needs to be disabled, then only the
     * {@code AKDropdownMenu} trigger element is returned to simulate a disabled
     * state.
     *
     * @param {Object} options - Additional configuration for display.
     * @param {Object} options.defaultSelected - The option that should be set
     * as currently chosen.
     * @param {boolean} options.isDisabled - If true, only the trigger element
     * will be returned to simulate a disabled dropdown.
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
        const trigger = this._createDropdownTrigger(triggerText);

        // FIXME Returning of just the trigger is a workaround for
        // {@code AKDropdownMenu} not supporting a disabled state, causing a
        // click to always show a dropdown. The true fix is to implement or wait
        // for {@code AKDropdownMenu} to support disabling or refactor this
        // component to use {@code StatelessDropdownMenu}.
        if (options.isDisabled) {
            return (
                <div className = 'device-selector-trigger-disabled'>
                    { trigger }
                </div>
            );
        }

        return (
            <AKDropdownMenu
                items = { [ { items: options.items || [] } ] }
                onItemActivated = { this._onSelect }
                shouldFitContainer = { true }>
                { trigger }
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
     * Creates an instance of {@code AKDropdownMenu} that is disabled and has a
     * placeholder indicating there are no devices to select.
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
     * Creates an instance of {@code AKDropdownMenu} that is disabled and has a
     * placeholder indicating there is no permission to display the devices.
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

export default translate(DeviceSelector);
