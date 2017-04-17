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
        _devices: React.PropTypes.object,

        /**
         * Device id for the current audio output device.
         */
        currentAudioOutputId: React.PropTypes.string,

        /**
         * JitsiLocalTrack for the current local audio.
         *
         * JitsiLocalTracks for the current audio and video, if any, should be
         * passed in for re-use in the previews. This is needed for Internet
         * Explorer, which cannot get multiple tracks from the same device, even
         * across tabs.
         */
        currentAudioTrack: React.PropTypes.object,

        /**
         * JitsiLocalTrack for the current local video.
         *
         * Needed for reuse. See comment for propTypes.currentAudioTrack.
         */
        currentVideoTrack: React.PropTypes.object,

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
         * Whether or not new audio input source can be selected.
         */
        hasAudioPermission: React.PropTypes.bool,

        /**
         * Whether or not new video input sources can be selected.
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
    }

    /**
     * Initializes a new DeviceSelectionDialog instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            // JitsiLocalTracks to use for live previewing.
            previewAudioTrack: null,
            previewVideoTrack: null,

            // Device ids to keep track of new selections.
            videInput: null,
            audioInput: null,
            audioOutput: null
        };

        // Preventing closing while cleaning up previews is important for
        // supporting temasys video cleanup. Temasys requires its video object
        // to be in the dom and visible for proper detaching of tracks. Delaying
        // closure until cleanup is complete ensures no errors in the process.
        this._isClosing = false;

        this._closeModal = this._closeModal.bind(this);
        this._getAndSetAudioOutput = this._getAndSetAudioOutput.bind(this);
        this._getAndSetAudioTrack = this._getAndSetAudioTrack.bind(this);
        this._getAndSetVideoTrack = this._getAndSetVideoTrack.bind(this);
        this._onCancel = this._onCancel.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Clean up any preview tracks that might not have been cleaned up already.
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
                                track = { this.state.previewVideoTrack
                                    || this.props.currentVideoTrack } />
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
        const cleanupPromises = [];

        if (!this._isPreviewingCurrentVideoTrack()) {
            cleanupPromises.push(this._disposeVideoPreview());
        }

        if (!this._isPreviewingCurrentAudioTrack()) {
            cleanupPromises.push(this._disposeAudioPreview());
        }

        return cleanupPromises;
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
     * Callback invoked when a new audio output device has been selected.
     * Updates the internal state of the user's selection.
     *
     * @param {string} deviceId - The id of the chosen audio output device.
     * @private
     * @returns {void}
     */
    _getAndSetAudioOutput(deviceId) {
        this.setState({
            audioOutput: deviceId
        });
    }

    /**
     * Callback invoked when a new audio input device has been selected.
     * Updates the internal state of the user's selection as well as the audio
     * track that should display in the preview. Will reuse the current local
     * audio track if it has been selected.
     *
     * @param {string} deviceId - The id of the chosen audio input device.
     * @private
     * @returns {void}
     */
    _getAndSetAudioTrack(deviceId) {
        this.setState({
            audioInput: deviceId
        }, () => {
            const cleanupPromise = this._isPreviewingCurrentAudioTrack()
                ? Promise.resolve() : this._disposeAudioPreview();

            if (this._isCurrentAudioTrack(deviceId)) {
                cleanupPromise
                    .then(() => {
                        this.setState({
                            previewAudioTrack: this.props.currentAudioTrack
                        });
                    });
            } else {
                cleanupPromise
                    .then(() => createLocalTrack('audio', deviceId))
                    .then(jitsiLocalTrack => {
                        this.setState({
                            previewAudioTrack: jitsiLocalTrack
                        });
                    });
            }
        });
    }

    /**
     * Callback invoked when a new video input device has been selected. Updates
     * the internal state of the user's selection as well as the video track
     * that should display in the preview. Will reuse the current local video
     * track if it has been selected.
     *
     * @param {string} deviceId - The id of the chosen video input device.
     * @private
     * @returns {void}
     */
    _getAndSetVideoTrack(deviceId) {
        this.setState({
            videoInput: deviceId
        }, () => {
            const cleanupPromise = this._isPreviewingCurrentVideoTrack()
                ? Promise.resolve() : this._disposeVideoPreview();

            if (this._isCurrentVideoTrack(deviceId)) {
                cleanupPromise
                    .then(() => {
                        this.setState({
                            previewVideoTrack: this.props.currentVideoTrack
                        });
                    });
            } else {
                cleanupPromise
                    .then(() => createLocalTrack('video', deviceId))
                    .then(jitsiLocalTrack => {
                        this.setState({
                            previewVideoTrack: jitsiLocalTrack
                        });
                    });
            }
        });
    }

    /**
     * Utility function for determining if the current local audio track has the
     * passed in device id.
     *
     * @param {string} deviceId - The device id to match against.
     * @private
     * @returns {boolean} True if the device id is being used by the local audio
     * track.
     */
    _isCurrentAudioTrack(deviceId) {
        return this.props.currentAudioTrack
            && this.props.currentAudioTrack.getDeviceId() === deviceId;
    }

    /**
     * Utility function for determining if the current local video track has the
     * passed in device id.
     *
     * @param {string} deviceId - The device id to match against.
     * @private
     * @returns {boolean} True if the device id is being used by the local
     * video track.
     */
    _isCurrentVideoTrack(deviceId) {
        return this.props.currentVideoTrack
            && this.props.currentVideoTrack.getDeviceId() === deviceId;
    }

    /**
     * Utility function for detecting if the current audio preview track is not
     * the currently used audio track.
     *
     * @private
     * @returns {boolean} True if the current audio track is being used for
     * the preview.
     */
    _isPreviewingCurrentAudioTrack() {
        return !this.state.previewAudioTrack
            || this.state.previewAudioTrack === this.props.currentAudioTrack;
    }

    /**
     * Utility function for detecting if the current video preview track is not
     * the currently used video track.
     *
     * @private
     * @returns {boolean} True if the current video track is being used as the
     * preview.
     */
    _isPreviewingCurrentVideoTrack() {
        return !this.state.previewVideoTrack
            || this.state.previewVideoTrack === this.props.currentVideoTrack;
    }

    /**
     * Cleans existing preview tracks and signal to closeDeviceSelectionDialog.
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
     * Identify changes to the preferred input/output devices and perform
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

        const deviceChangePromises = [];

        if (this.state.videoInput && !this._isPreviewingCurrentVideoTrack()) {
            const changeVideoPromise = this._disposeVideoPreview()
                .then(() => {
                    this.props.dispatch(setVideoInputDevice(
                        this.state.videoInput));
                });

            deviceChangePromises.push(changeVideoPromise);
        }

        if (this.state.audioInput && !this._isPreviewingCurrentAudioTrack()) {
            const changeAudioPromise = this._disposeAudioPreview()
                .then(() => {
                    this.props.dispatch(setAudioInputDevice(
                        this.state.audioInput));
                });

            deviceChangePromises.push(changeAudioPromise);
        }

        if (this.state.audioOutput
            && this.state.audioOutput !== this.props.currentAudioOutputId) {
            this.props.dispatch(setAudioOutputDevice(this.state.audioOutput));
        }

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
                track = { this.state.previewAudioTrack
                    || this.props.currentAudioTrack } />
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
                deviceId = { this.state.audioOutput
                    || this.props.currentAudioOutputId } />
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
        const availableDevices = this.props._devices;
        const currentAudioId = this.state.audioInput
            || (this.props.currentAudioTrack
                && this.props.currentAudioTrack.getDeviceId());
        const currentAudioOutId = this.state.audioOutput
            || this.props.currentAudioOutputId;

        // FIXME: On temasys, without a device selected and put into local
        // storage as the default device to use, the current video device id is
        // a blank string. This is because the library gets a local video track
        // and then maps the track's device id by matching the track's label to
        // the MediaDeviceInfos returned from enumerateDevices. In WebRTC, the
        // track label is expected to return the camera device label. However,
        // temasys video track labels refer to track id, not device label, so
        // the library cannot match the track to a device. The workaround of
        // defaulting to the first videoInput available has been re-used from
        // the previous device settings implementation.
        const currentVideoId = this.state.videoInput
            || (this.props.currentVideoTrack
                && this.props.currentVideoTrack.getDeviceId())
            || (availableDevices.videoInput[0]
                && availableDevices.videoInput[0].deviceId)
            || ''; // DeviceSelector expects a string for prop selectedDeviceId.

        const configurations = [
            {
                devices: availableDevices.videoInput,
                hasPermission: this.props.hasVideoPermission,
                icon: 'icon-camera',
                isDisabled: this.props.disableDeviceChange,
                key: 'videoInput',
                label: 'settings.selectCamera',
                onSelect: this._getAndSetVideoTrack,
                selectedDeviceId: currentVideoId
            },
            {
                devices: availableDevices.audioInput,
                hasPermission: this.props.hasAudioPermission,
                icon: 'icon-microphone',
                isDisabled: this.props.disableAudioInputChange
                    || this.props.disableDeviceChange,
                key: 'audioInput',
                label: 'settings.selectMic',
                onSelect: this._getAndSetAudioTrack,
                selectedDeviceId: currentAudioId
            }
        ];

        if (!this.props.hideAudioOutputSelect) {
            configurations.push({
                devices: availableDevices.audioOutput,
                hasPermission: this.props.hasAudioPermission
                    || this.props.hasVideoPermission,
                icon: 'icon-volume',
                isDisabled: this.props.disableDeviceChange,
                key: 'audioOutput',
                label: 'settings.selectAudioOutput',
                onSelect: this._getAndSetAudioOutput,
                selectedDeviceId: currentAudioOutId
            });
        }

        return configurations.map(this._renderSelector);
    }
}

/**
 * Maps (parts of) the Redux state to the associated DeviceSelectionDialog's
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _devices: Object
 * }}
 */
function _mapStateToProps(state) {
    return {
        _devices: state['features/base/devices']
    };
}

export default translate(connect(_mapStateToProps)(DeviceSelectionDialog));
