// @flow

import _ from 'lodash';
import React, { Component } from 'react';
import { NativeModules, Text, TouchableHighlight, View } from 'react-native';
import { connect } from 'react-redux';

import { hideDialog, BottomSheet } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { Icon } from '../../../base/font-icons';
import { ColorPalette } from '../../../base/styles';

import styles from './styles';

/**
 * Type definition for a single entry in the device list.
 */
type Device = {

    /**
     * Name of the icon which will be rendered on the right.
     */
    iconName: string,

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
    type: string
};

/**
 * {@code AudioRoutePickerDialog}'s React {@code Component} prop types.
 */
type Props = {

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

const { AudioMode } = NativeModules;

/**
 * Maps each device type to a display name and icon.
 */
const deviceInfoMap = {
    BLUETOOTH: {
        iconName: 'bluetooth',
        text: 'audioDevices.bluetooth',
        type: 'BLUETOOTH'
    },
    EARPIECE: {
        iconName: 'phone-talk',
        text: 'audioDevices.phone',
        type: 'EARPIECE'
    },
    HEADPHONES: {
        iconName: 'headset',
        text: 'audioDevices.headphones',
        type: 'HEADPHONES'
    },
    SPEAKER: {
        iconName: 'volume',
        text: 'audioDevices.speaker',
        type: 'SPEAKER'
    }
};

/**
 * The exported React {@code Component}. {@code AudioRoutePickerDialog} is
 * exported only if the {@code AudioMode} module has the capability to get / set
 * audio devices.
 */
let AudioRoutePickerDialog_;

/**
 * Implements a React {@code Component} which prompts the user when a password
 * is required to join a conference.
 */
class AudioRoutePickerDialog extends Component<Props, State> {
    state = {
        /**
         * Available audio devices, it will be set in
         * {@link #componentDidMount()}.
         */
        devices: []
    };

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
    }

    /**
     * Initializes the device list by querying {@code AudioMode}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        AudioMode.getAudioDevices().then(({ devices, selected }) => {
            const audioDevices = [];

            if (devices) {
                for (const device of devices) {
                    if (deviceInfoMap[device]) {
                        const info = Object.assign({}, deviceInfoMap[device]);

                        info.selected = device === selected;
                        info.text = this.props.t(info.text);
                        audioDevices.push(info);
                    }
                }
            }

            if (audioDevices) {
                // Make sure devices is alphabetically sorted.
                this.setState({
                    devices: _.sortBy(audioDevices, 'text')
                });
            }
        });
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
            AudioMode.setAudioDevice(device.type);
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
        const { iconName, selected, text } = device;
        const selectedStyle = selected ? styles.selectedText : {};

        return (
            <TouchableHighlight
                key = { device.type }
                onPress = { this._onSelectDeviceFn(device) }
                underlayColor = { ColorPalette.overflowMenuItemUnderlay } >
                <View style = { styles.deviceRow } >
                    <Icon
                        name = { iconName }
                        style = { [ styles.deviceIcon, selectedStyle ] } />
                    <Text style = { [ styles.deviceText, selectedStyle ] } >
                        { text }
                    </Text>
                </View>
            </TouchableHighlight>
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

        if (!devices.length) {
            return null;
        }

        return (
            <BottomSheet onCancel = { this._onCancel }>
                { this.state.devices.map(this._renderDevice, this) }
            </BottomSheet>
        );
    }
}

// Only export the dialog if we have support for getting / setting audio devices
// in AudioMode.
if (AudioMode.getAudioDevices && AudioMode.setAudioDevice) {
    AudioRoutePickerDialog_ = translate(connect()(AudioRoutePickerDialog));
}

export default AudioRoutePickerDialog_;
