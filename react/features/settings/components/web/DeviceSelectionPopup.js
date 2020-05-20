/* global JitsiMeetJS */

import { AtlasKitThemeProvider } from '@atlaskit/theme';
import React from 'react';
import ReactDOM from 'react-dom';
import { I18nextProvider } from 'react-i18next';

import {
    getAvailableDevices,
    getCurrentDevices,
    isDeviceChangeAvailable,
    isDeviceListAvailable,
    isMultipleAudioInputSupported,
    setAudioInputDevice,
    setAudioOutputDevice,
    setVideoInputDevice
} from '../../../../../modules/API/external/functions';
import {
    PostMessageTransportBackend,
    Transport
} from '../../../../../modules/transport';
import DialogWithTabs from '../../../base/dialog/components/web/DialogWithTabs';
import { parseURLParams } from '../../../base/util/parseURLParams';
import DeviceSelection from '../../../device-selection/components/DeviceSelection';

/**
 * Implements a class that renders the React components for the device selection
 * popup page and handles the communication between the components and Jitsi
 * Meet.
 */
export default class DeviceSelectionPopup {
    /**
     * Initializes a new DeviceSelectionPopup instance.
     *
     * @param {Object} i18next - The i18next instance used for translation.
     */
    constructor(i18next) {
        this.close = this.close.bind(this);
        this._i18next = i18next;
        this._onSubmit = this._onSubmit.bind(this);

        const { scope } = parseURLParams(window.location);

        this._transport = new Transport({
            backend: new PostMessageTransportBackend({
                postisOptions: {
                    scope,
                    window: window.opener
                }
            })
        });

        this._transport.on('event', event => {
            if (event.name === 'deviceListChanged') {
                this._updateAvailableDevices();

                return true;
            }

            return false;
        });

        this._dialogProps = {
            availableDevices: {},
            selectedAudioInputId: '',
            selectedAudioOutputId: '',
            selectedVideoInputId: '',
            disableAudioInputChange: true,
            disableBlanketClickDismiss: true,
            disableDeviceChange: true,
            hideAudioInputPreview: !JitsiMeetJS.isCollectingLocalStats(),
            hideAudioOutputSelect: true

        };
        this._initState();
    }

    /**
     * Sends event to Jitsi Meet to close the popup dialog.
     *
     * @returns {void}
     */
    close() {
        this._transport.sendEvent({
            type: 'devices-dialog',
            name: 'close'
        });
    }

    /**
     * Changes the properties of the react component and re-renders it.
     *
     * @param {Object} newProps - The new properties that will be assigned to
     * the current ones.
     * @returns {void}
     */
    _changeDialogProps(newProps) {
        this._dialogProps = {
            ...this._dialogProps,
            ...newProps
        };
        this._render();
    }

    /**
     * Returns Promise that resolves with result an list of available devices.
     *
     * @returns {Promise}
     */
    _getAvailableDevices() {
        return getAvailableDevices(this._transport);
    }

    /**
     * Returns Promise that resolves with current selected devices.
     *
     * @returns {Promise}
     */
    _getCurrentDevices() {
        return getCurrentDevices(this._transport).then(currentDevices => {
            const {
                audioInput = {},
                audioOutput = {},
                videoInput = {}
            } = currentDevices;

            return {
                audioInput: audioInput.deviceId,
                audioOutput: audioOutput.deviceId,
                videoInput: videoInput.deviceId
            };
        });
    }

    /**
     * Initializes the state.
     *
     * @returns {void}
     */
    _initState() {
        return Promise.all([
            this._getAvailableDevices(),
            this._isDeviceListAvailable(),
            this._isDeviceChangeAvailable(),
            this._isDeviceChangeAvailable('output'),
            this._getCurrentDevices(),
            this._isMultipleAudioInputSupported()
        ]).then(([
            availableDevices,
            listAvailable,
            changeAvailable,
            changeOutputAvailable,
            currentDevices,
            multiAudioInputSupported
        ]) => {
            this._changeDialogProps({
                availableDevices,
                selectedAudioInputId: currentDevices.audioInput,
                selectedAudioOutputId: currentDevices.audioOutput,
                selectedVideoInputId: currentDevices.videoInput,
                disableAudioInputChange: !multiAudioInputSupported,
                disableDeviceChange: !listAvailable || !changeAvailable,
                hideAudioOutputSelect: !changeOutputAvailable
            });
        });
    }

    /**
     * Returns Promise that resolves with true if the device change is available
     * and with false if not.
     *
     * @param {string} [deviceType] - Values - 'output', 'input' or undefined.
     * Default - 'input'.
     * @returns {Promise}
     */
    _isDeviceChangeAvailable(deviceType) {
        return isDeviceChangeAvailable(this._transport, deviceType).catch(() => false);
    }

    /**
     * Returns Promise that resolves with true if the device list is available
     * and with false if not.
     *
     * @returns {Promise}
     */
    _isDeviceListAvailable() {
        return isDeviceListAvailable(this._transport).catch(() => false);
    }

    /**
     * Returns Promise that resolves with true if multiple audio input is supported
     * and with false if not.
     *
     * @returns {Promise}
     */
    _isMultipleAudioInputSupported() {
        return isMultipleAudioInputSupported(this._transport).catch(() => false);
    }

    /**
     * Callback invoked to save changes to selected devices and close the
     * dialog.
     *
     * @param {Object} newSettings - The chosen device IDs.
     * @private
     * @returns {void}
     */
    _onSubmit(newSettings) {
        const promises = [];

        if (newSettings.selectedVideoInputId
                !== this._dialogProps.selectedVideoInputId) {
            promises.push(
                this._setVideoInputDevice(newSettings.selectedVideoInputId));
        }

        if (newSettings.selectedAudioInputId
                !== this._dialogProps.selectedAudioInputId) {
            promises.push(
                this._setAudioInputDevice(newSettings.selectedAudioInputId));
        }

        if (newSettings.selectedAudioOutputId
                !== this._dialogProps.selectedAudioOutputId) {
            promises.push(
                this._setAudioOutputDevice(newSettings.selectedAudioOutputId));
        }

        Promise.all(promises).then(this.close, this.close);
    }

    /**
     * Renders the React components for the popup page.
     *
     * @returns {void}
     */
    _render() {
        const onSubmit = this.close;

        ReactDOM.render(
            <I18nextProvider i18n = { this._i18next }>
                <AtlasKitThemeProvider mode = 'dark'>
                    <DialogWithTabs
                        closeDialog = { this.close }
                        cssClassName = 'settings-dialog'
                        onSubmit = { onSubmit }
                        tabs = { [ {
                            component: DeviceSelection,
                            label: 'settings.devices',
                            props: this._dialogProps,
                            submit: this._onSubmit
                        } ] }
                        titleKey = 'settings.title' />
                </AtlasKitThemeProvider>
            </I18nextProvider>,
            document.getElementById('react'));
    }

    /**
     * Sets the audio input device to the one with the id that is passed.
     *
     * @param {string} id - The id of the new device.
     * @returns {Promise}
     */
    _setAudioInputDevice(id) {
        return setAudioInputDevice(this._transport, undefined, id);
    }

    /**
     * Sets the audio output device to the one with the id that is passed.
     *
     * @param {string} id - The id of the new device.
     * @returns {Promise}
     */
    _setAudioOutputDevice(id) {
        return setAudioOutputDevice(this._transport, undefined, id);
    }

    /**
     * Sets the video input device to the one with the id that is passed.
     *
     * @param {string} id - The id of the new device.
     * @returns {Promise}
     */
    _setVideoInputDevice(id) {
        return setVideoInputDevice(this._transport, undefined, id);
    }

    /**
     * Updates the available devices.
     *
     * @returns {void}
     */
    _updateAvailableDevices() {
        this._getAvailableDevices().then(devices =>
            this._changeDialogProps({ availableDevices: devices })
        );
    }
}
