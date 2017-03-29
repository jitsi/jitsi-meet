import Select from '@atlaskit/single-select';
import React, { Component } from 'react';

import { translate } from '../../base/i18n';

/**
 * React component for selecting a device from a select element. Wraps Select
 * with device selection specific logic.
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

        const items = this.props.devices.map(this._createSelectItem);
        const defaultSelected = items.find(item =>
            item.value === this.props.selectedDeviceId
        );

        return this._createSelector({
            defaultSelected,
            isDisabled: this.props.isDisabled,
            items,
            placeholder: 'deviceSelection.selectADevice'
        });
    }

    /**
     * Creates an object in the format expected by Select for an option element.
     *
     * @param {MediaDeviceInfo} device - An object with a label and a deviceId.
     * @private
     * @returns {Object} The passed in media device description converted to a
     * format recognized as a valid Select item.
     */
    _createSelectItem(device) {
        return {
            content: device.label,
            value: device.deviceId
        };
    }

    /**
     * Creates a Select Component using passed in props and options.
     *
     * @param {Object} options - Additional configuration for display Select.
     * @param {Object} options.defaultSelected - The option that should be set
     * as currently chosen.
     * @param {boolean} options.isDisabled - If true Select will not open on
     * click.
     * @param {Array} options.items - All the selectable options to display.
     * @param {string} options.placeholder - The translation key to display when
     * no selection has been made.
     * @private
     * @returns {ReactElement}
     */
    _createSelector(options) {
        return (
            <Select
                defaultSelected = { options.defaultSelected }
                isDisabled = { options.isDisabled }
                isFirstChild = { true }
                items = { [ { items: options.items || [] } ] }
                label = { this.props.t(this.props.label) }
                noMatchesFound
                    = { this.props.t('deviceSelection.noOtherDevices') }
                onSelected = { this._onSelect }
                placeholder = { this.props.t(options.placeholder) }
                shouldFitContainer = { true } />
        );
    }

    /**
     * Invokes the passed in callback to notify of selection changes.
     *
     * @param {Object} selection - Event returned from Select.
     * @private
     * @returns {void}
     */
    _onSelect(selection) {
        this.props.onSelect(selection.item.value);
    }

    /**
     * Creates a Select Component that is disabled and has a placeholder
     * indicating there are no devices to select.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderNoDevices() {
        return this._createSelector({
            isDisabled: true,
            placeholder: 'settings.noDevice'
        });
    }

    /**
     * Creates a Select Component that is disabled and has a placeholder stating
     * there is no permission to display the devices.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderNoPermission() {
        return this._createSelector({
            isDisabled: true,
            placeholder: 'settings.noPermission'
        });
    }
}

export default translate(DeviceSelector);
