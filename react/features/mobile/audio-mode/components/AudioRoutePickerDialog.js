// @flow

import _ from 'lodash';
import React, { Component } from 'react';
import { NativeModules, Text, TouchableHighlight, View } from 'react-native';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { hideDialog, BottomSheet } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import {
    Icon,
    IconDeviceBluetooth,
    IconDeviceEarpiece,
    IconDeviceHeadphone,
    IconDeviceSpeaker
} from '../../../base/icons';
import { connect } from '../../../base/redux';
import { ColorPalette, type StyleType } from '../../../base/styles';

import styles from './styles';

const { AudioMode } = NativeModules;

/**
 * Type definition for a single entry in the device list.
 */
type Device = {

    /**
     * Name of the icon which will be rendered on the right.
     */
    icon: Object,

    /**
     * True if the element is selected (will be highlighted in blue),
     * false otherwise.
     */
    selected: boolean,

    /**
     * Text which will be rendered in the row.
     */
    text: string,

    /**
     * Device type.
     */
    type: string,

    /**
     * Unique device ID.
     */
    uid: ?string
};

/**
 * "Raw" device, as returned by native.
 */
type RawDevice = {

    /**
     * Display name for the device.
     */
    name: ?string,

    /**
     * is this device selected?
     */
    selected: boolean,

    /**
     * Device type.
     */
    type: string,

    /**
     * Unique device ID.
     */
    uid: ?string
};

/**
 * {@code AudioRoutePickerDialog}'s React {@code Component} prop types.
 */
type Props = {

    /**
     * Style of the bottom sheet feature.
     */
    _bottomSheetStyles: StyleType,

    /**
     * Object describing available devices.
     */
    _devices: Array<RawDevice>,

    /**
     * Used for hiding the dialog when the selection was completed.
     */
    dispatch: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * {@code AudioRoutePickerDialog}'s React {@code Component} state types.
 */
type State = {

    /**
     * Array of available devices.
     */
    devices: Array<Device>
};

/**
 * Maps each device type to a display name and icon.
 */
const deviceInfoMap = {
    BLUETOOTH: {
        icon: IconDeviceBluetooth,
        text: 'audioDevices.bluetooth',
        type: 'BLUETOOTH'
    },
    EARPIECE: {
        icon: IconDeviceEarpiece,
        text: 'audioDevices.phone',
        type: 'EARPIECE'
    },
    HEADPHONES: {
        icon: IconDeviceHeadphone,
        text: 'audioDevices.headphones',
        type: 'HEADPHONES'
    },
    SPEAKER: {
        icon: IconDeviceSpeaker,
        text: 'audioDevices.speaker',
        type: 'SPEAKER'
    }
};

/**
 * The exported React {@code Component}.
 */
let AudioRoutePickerDialog_; // eslint-disable-line prefer-const

/**
 * Implements a React {@code Component} which prompts the user when a password
 * is required to join a conference.
 */
class AudioRoutePickerDialog extends Component<Props, State> {
    state = {
        /**
         * Available audio devices, it will be set in
         * {@link #getDerivedStateFromProps()}.
         */
        devices: []
    };

    /**
     * Implements React's {@link Component#getDerivedStateFromProps()}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: Props) {
        const { _devices: devices } = props;

        if (!devices) {
            return null;
        }

        const audioDevices = [];

        for (const device of devices) {
            const infoMap = deviceInfoMap[device.type];
            const text = device.type === 'BLUETOOTH' && device.name ? device.name : infoMap.text;

            if (infoMap) {
                const info = {
                    ...infoMap,
                    selected: Boolean(device.selected),
                    text: props.t(text),
                    uid: device.uid
                };

                audioDevices.push(info);
            }
        }

        // Make sure devices is alphabetically sorted.
        return {
            devices: _.sortBy(audioDevices, 'text')
        };
    }

    /**
     * Initializes a new {@code PasswordRequiredPrompt} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onCancel = this._onCancel.bind(this);

        // Trigger an initial update.
        AudioMode.updateDeviceList && AudioMode.updateDeviceList();
    }

    /**
     * Dispatches a redux action to hide this sheet.
     *
     * @returns {void}
     */
    _hide() {
        this.props.dispatch(hideDialog(AudioRoutePickerDialog_));
    }

    _onCancel: () => void;

    /**
     * Cancels the dialog by hiding it.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        this._hide();
    }

    _onSelectDeviceFn: (Device) => Function;

    /**
     * Builds and returns a function which handles the selection of a device
     * on the sheet. The selected device will be used by {@code AudioMode}.
     *
     * @param {Device} device - Object representing the selected device.
     * @private
     * @returns {Function}
     */
    _onSelectDeviceFn(device: Device) {
        return () => {
            this._hide();
            AudioMode.setAudioDevice(device.uid || device.type);
        };
    }

    /**
     * Renders a single device.
     *
     * @param {Device} device - Object representing a single device.
     * @private
     * @returns {ReactElement}
     */
    _renderDevice(device: Device) {
        const { _bottomSheetStyles } = this.props;
        const { icon, selected, text } = device;
        const selectedStyle = selected ? styles.selectedText : {};

        return (
            <TouchableHighlight
                key = { device.type }
                onPress = { this._onSelectDeviceFn(device) }
                underlayColor = { ColorPalette.overflowMenuItemUnderlay } >
                <View style = { styles.deviceRow } >
                    <Icon
                        src = { icon }
                        style = { [ styles.deviceIcon, _bottomSheetStyles.buttons.iconStyle, selectedStyle ] } />
                    <Text style = { [ styles.deviceText, _bottomSheetStyles.buttons.labelStyle, selectedStyle ] } >
                        { text }
                    </Text>
                </View>
            </TouchableHighlight>
        );
    }

    /**
     * Renders a "fake" device row indicating there are no devices.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderNoDevices() {
        const { _bottomSheetStyles, t } = this.props;

        return (
            <View style = { styles.deviceRow } >
                <Icon
                    src = { deviceInfoMap.SPEAKER.icon }
                    style = { [ styles.deviceIcon, _bottomSheetStyles.buttons.iconStyle ] } />
                <Text style = { [ styles.deviceText, _bottomSheetStyles.buttons.labelStyle ] } >
                    { t('audioDevices.none') }
                </Text>
            </View>
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { devices } = this.state;
        let content;

        if (devices.length === 0) {
            content = this._renderNoDevices();
        } else {
            content = this.state.devices.map(this._renderDevice, this);
        }

        return (
            <BottomSheet onCancel = { this._onCancel }>
                { content }
            </BottomSheet>
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Object}
 */
function _mapStateToProps(state) {
    return {
        _bottomSheetStyles: ColorSchemeRegistry.get(state, 'BottomSheet'),
        _devices: state['features/mobile/audio-mode'].devices
    };
}

AudioRoutePickerDialog_ = translate(connect(_mapStateToProps)(AudioRoutePickerDialog));

export default AudioRoutePickerDialog_;
