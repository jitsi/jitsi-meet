import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
    setAudioInputDevice,
    setAudioOutputDevice,
    setVideoInputDevice
} from '../../base/devices';
import {
    Dialog,
    hideDialog
} from '../../base/dialog';
import { translate } from '../../base/i18n';
import { createLocalTrack } from '../../base/lib-jitsi-meet';

import AudioInputPreview from './AudioInputPreview';
import AudioOutputPreview from './AudioOutputPreview';
import DeviceSelector from './DeviceSelector';
import VideoInputPreview from './VideoInputPreview';

/**
 * React component for previewing and selecting new audio and video sources.
 *
 * @extends Component
 */
class DeviceSelectionDialog extends Component {
    /**
     * DeviceSelectionDialog component's property types.
     *
     * @static
     */
    static propTypes = {
       /**
         * All known audio and video devices split by type. This prop comes from
         * the app state.
         */
        _availableDevices: React.PropTypes.object,

        /**
         * Device id for the current audio input device. This device will be set
         * as the default audio input device to preview.
         */
        currentAudioInputId: React.PropTypes.string,

        /**
         * Device id for the current audio output device. This device will be
         * set as the default audio output device to preview.
         */
        currentAudioOutputId: React.PropTypes.string,

        /**
         * Device id for the current video input device. This device will be set
         * as the default video input device to preview.
         */
        currentVideoInputId: React.PropTypes.string,

        /**
         * Whether or not the audio selector can be interacted with. If true,
         * the audio input selector will be rendered as disabled. This is
         * specifically used to prevent audio device changing in Firefox, which
         * currently does not work due to a browser-side regression.
         */
        disableAudioInputChange: React.PropTypes.bool,

        /**
         * True if device changing is configured to be disallowed. Selectors
         * will display as disabled.
         */
        disableDeviceChange: React.PropTypes.bool,

        /**
         * Invoked to notify the store of app state changes.
         */
        dispatch: React.PropTypes.func,

        /**
         * Whether or not a new audio input source can be selected.
         */
        hasAudioPermission: React.PropTypes.bool,

        /**
         * Whether or not a new video input sources can be selected.
         */
        hasVideoPermission: React.PropTypes.bool,

        /**
         * If true, the audio meter will not display. Necessary for browsers or
         * configurations that do not support local stats to prevent a
         * non-responsive mic preview from displaying.
         */
        hideAudioInputPreview: React.PropTypes.bool,

        /**
         * Whether or not the audio output source selector should display. If
         * true, the audio output selector and test audio link will not be
         * rendered. This is specifically used for hiding audio output on
         * temasys browsers which do not support such change.
         */
        hideAudioOutputSelect: React.PropTypes.bool,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    };

    /**
     * Initializes a new DeviceSelectionDialog instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        const { _availableDevices } = this.props;

        this.state = {
            // JitsiLocalTrack to use for live previewing of audio input.
            previewAudioTrack: null,

            // JitsiLocalTrack to use for live previewing of video input.
            previewVideoTrack: null,

            // An message describing a problem with obtaining a video preview.
            previewVideoTrackError: null,

            // The audio input device id to show as selected by default.
            selectedAudioInputId: this.props.currentAudioInputId || '',

            // The audio output device id to show as selected by default.
            selectedAudioOutputId: this.props.currentAudioOutputId || '',

            // The video input device id to show as selected by default.
            // FIXME: On temasys, without a device selected and put into local
            // storage as the default device to use, the current video device id
            // is a blank string. This is because the library gets a local video
            // track and then maps the track's device id by matching the track's
            // label to the MediaDeviceInfos returned from enumerateDevices. In
            // WebRTC, the track label is expected to return the camera device
            // label. However, temasys video track labels refer to track id, not
            // device label, so the library cannot match the track to a device.
            // The workaround of defaulting to the first videoInput available
            // is re-used from the previous device settings implementation.
            selectedVideoInputId: this.props.currentVideoInputId
                || (_availableDevices.videoInput
                    && _availableDevices.videoInput[0]
                    && _availableDevices.videoInput[0].deviceId)
                || ''
        };

        // Preventing closing while cleaning up previews is important for
        // supporting temasys video cleanup. Temasys requires its video object
        // to be in the dom and visible for proper detaching of tracks. Delaying
        // closure until cleanup is complete ensures no errors in the process.
        this._isClosing = false;

        // Bind event handlers so they are only bound once for every instance.
        this._closeModal = this._closeModal.bind(this);
        this._onCancel = this._onCancel.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._updateAudioOutput = this._updateAudioOutput.bind(this);
        this._updateAudioInput = this._updateAudioInput.bind(this);
        this._updateVideoInput = this._updateVideoInput.bind(this);
    }

    /**
     * Sets default device choices so a choice is pre-selected in the dropdowns
     * and live previews are created.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._updateAudioOutput(this.state.selectedAudioOutputId);
        this._updateAudioInput(this.state.selectedAudioInputId);
        this._updateVideoInput(this.state.selectedVideoInputId);
    }

    /**
     * Disposes preview tracks that might not already be disposed.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        // This handles the case where neither submit nor cancel were triggered,
        // such as on modal switch. In that case, make a dying attempt to clean
        // up previews.
        if (!this._isClosing) {
            this._attemptPreviewTrackCleanup();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <Dialog
                cancelTitleKey = { 'dialog.Cancel' }
                okTitleKey = { 'dialog.Save' }
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit }
                titleKey = 'deviceSelection.deviceSettings' >
                <div className = 'device-selection'>
                    <div className = 'device-selection-column column-video'>
                        <div className = 'device-selection-video-container'>
                            <VideoInputPreview
                                error = { this.state.previewVideoTrackError }
                                track = { this.state.previewVideoTrack } />
                        </div>
                        { this._renderAudioInputPreview() }
                    </div>
                    <div className = 'device-selection-column column-selectors'>
                        <div className = 'device-selectors'>
                            { this._renderSelectors() }
                        </div>
                        { this._renderAudioOutputPreview() }
                    </div>
                </div>
            </Dialog>
        );
    }

    /**
     * Cleans up preview tracks if they are not active tracks.
     *
     * @private
     * @returns {Array<Promise>} Zero to two promises will be returned. One
     * promise can be for video cleanup and another for audio cleanup.
     */
    _attemptPreviewTrackCleanup() {
        return Promise.all([
            this._disposeVideoPreview(),
            this._disposeAudioPreview()
        ]);
    }

    /**
     * Signals to close DeviceSelectionDialog.
     *
     * @private
     * @returns {void}
     */
    _closeModal() {
        this.props.dispatch(hideDialog());
    }

    /**
     * Utility function for disposing the current audio preview.
     *
     * @private
     * @returns {Promise}
     */
    _disposeAudioPreview() {
        return this.state.previewAudioTrack
            ? this.state.previewAudioTrack.dispose() : Promise.resolve();
    }

    /**
     * Utility function for disposing the current video preview.
     *
     * @private
     * @returns {Promise}
     */
    _disposeVideoPreview() {
        return this.state.previewVideoTrack
            ? this.state.previewVideoTrack.dispose() : Promise.resolve();
    }

    /**
     * Disposes preview tracks and signals to close DeviceSelectionDialog.
     *
     * @private
     * @returns {boolean} Returns false to prevent closure until cleanup is
     * complete.
     */
    _onCancel() {
        if (this._isClosing) {
            return false;
        }

        this._isClosing = true;

        const cleanupPromises = this._attemptPreviewTrackCleanup();

        Promise.all(cleanupPromises)
            .then(this._closeModal)
            .catch(this._closeModal);

        return false;
    }

    /**
     * Identifies changes to the preferred input/output devices and perform
     * necessary cleanup and requests to use those devices. Closes the modal
     * after cleanup and device change requests complete.
     *
     * @private
     * @returns {boolean} Returns false to prevent closure until cleanup is
     * complete.
     */
    _onSubmit() {
        if (this._isClosing) {
            return false;
        }

        this._isClosing = true;

        const deviceChangePromises = this._attemptPreviewTrackCleanup()
            .then(() => {
                if (this.state.selectedVideoInputId
                        !== this.props.currentVideoInputId) {
                    this.props.dispatch(
                        setVideoInputDevice(this.state.selectedVideoInputId));
                }

                if (this.state.selectedAudioInputId
                        !== this.props.currentAudioInputId) {
                    this.props.dispatch(
                        setAudioInputDevice(this.state.selectedAudioInputId));
                }

                if (this.state.selectedAudioOutputId
                        !== this.props.currentAudioOutputId) {
                    this.props.dispatch(
                        setAudioOutputDevice(this.state.selectedAudioOutputId));
                }
            });

        Promise.all(deviceChangePromises)
            .then(this._closeModal)
            .catch(this._closeModal);

        return false;
    }

    /**
     * Creates an AudioInputPreview for previewing if audio is being received.
     * Null will be returned if local stats for tracking audio input levels
     * cannot be obtained.
     *
     * @private
     * @returns {ReactComponent|null}
     */
    _renderAudioInputPreview() {
        if (this.props.hideAudioInputPreview) {
            return null;
        }

        return (
            <AudioInputPreview
                track = { this.state.previewAudioTrack } />
        );
    }

    /**
     * Creates an AudioOutputPreview instance for playing a test sound with the
     * passed in device id. Null will be returned if hideAudioOutput is truthy.
     *
     * @private
     * @returns {ReactComponent|null}
     */
    _renderAudioOutputPreview() {
        if (this.props.hideAudioOutputSelect) {
            return null;
        }

        return (
            <AudioOutputPreview
                deviceId = { this.state.selectedAudioOutputId } />
        );
    }

    /**
     * Creates a DeviceSelector instance based on the passed in configuration.
     *
     * @private
     * @param {Object} props - The props for the DeviceSelector.
     * @returns {ReactElement}
     */
    _renderSelector(props) {
        return (
            <DeviceSelector { ...props } />
        );
    }

    /**
     * Creates DeviceSelector instances for video output, audio input, and audio
     * output.
     *
     * @private
     * @returns {Array<ReactElement>} DeviceSelector instances.
     */
    _renderSelectors() {
        const { _availableDevices } = this.props;
        const configurations = [
            {
                devices: _availableDevices.videoInput,
                hasPermission: this.props.hasVideoPermission,
                icon: 'icon-camera',
                isDisabled: this.props.disableDeviceChange,
                key: 'videoInput',
                label: 'settings.selectCamera',
                onSelect: this._updateVideoInput,
                selectedDeviceId: this.state.selectedVideoInputId
            },
            {
                devices: _availableDevices.audioInput,
                hasPermission: this.props.hasAudioPermission,
                icon: 'icon-microphone',
                isDisabled: this.props.disableAudioInputChange
                    || this.props.disableDeviceChange,
                key: 'audioInput',
                label: 'settings.selectMic',
                onSelect: this._updateAudioInput,
                selectedDeviceId: this.state.selectedAudioInputId
            }
        ];

        if (!this.props.hideAudioOutputSelect) {
            configurations.push({
                devices: _availableDevices.audioOutput,
                hasPermission: this.props.hasAudioPermission
                    || this.props.hasVideoPermission,
                icon: 'icon-volume',
                isDisabled: this.props.disableDeviceChange,
                key: 'audioOutput',
                label: 'settings.selectAudioOutput',
                onSelect: this._updateAudioOutput,
                selectedDeviceId: this.state.selectedAudioOutputId
            });
        }

        return configurations.map(this._renderSelector);
    }

    /**
     * Callback invoked when a new audio input device has been selected. Updates
     * the internal state of the user's selection as well as the audio track
     * that should display in the preview.
     *
     * @param {string} deviceId - The id of the chosen audio input device.
     * @private
     * @returns {void}
     */
    _updateAudioInput(deviceId) {
        this.setState({
            selectedAudioInputId: deviceId
        }, () => {
            this._disposeAudioPreview()
                .then(() => createLocalTrack('audio', deviceId))
                .then(jitsiLocalTrack => {
                    this.setState({
                        previewAudioTrack: jitsiLocalTrack
                    });
                })
                .catch(() => {
                    this.setState({
                        previewAudioTrack: null
                    });
                });
        });
    }

    /**
     * Callback invoked when a new audio output device has been selected.
     * Updates the internal state of the user's selection.
     *
     * @param {string} deviceId - The id of the chosen audio output device.
     * @private
     * @returns {void}
     */
    _updateAudioOutput(deviceId) {
        this.setState({
            selectedAudioOutputId: deviceId
        });
    }

    /**
     * Callback invoked when a new video input device has been selected. Updates
     * the internal state of the user's selection as well as the video track
     * that should display in the preview.
     *
     * @param {string} deviceId - The id of the chosen video input device.
     * @private
     * @returns {void}
     */
    _updateVideoInput(deviceId) {
        this.setState({
            selectedVideoInputId: deviceId
        }, () => {
            this._disposeVideoPreview()
                .then(() => createLocalTrack('video', deviceId))
                .then(jitsiLocalTrack => {
                    this.setState({
                        previewVideoTrack: jitsiLocalTrack,
                        previewVideoTrackError: null
                    });
                })
                .catch(() => {
                    this.setState({
                        previewVideoTrack: null,
                        previewVideoTrackError:
                            this.props.t('deviceSelection.previewUnavailable')
                    });
                });
        });
    }
}

/**
 * Maps (parts of) the Redux state to the associated DeviceSelectionDialog's
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _availableDevices: Object
 * }}
 */
function _mapStateToProps(state) {
    return {
        _availableDevices: state['features/base/devices']
    };
}

export default translate(connect(_mapStateToProps)(DeviceSelectionDialog));
