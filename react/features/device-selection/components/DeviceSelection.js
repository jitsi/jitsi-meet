// @flow

import React from 'react';

import { AbstractDialogTab } from '../../base/dialog';
import type { Props as AbstractDialogTabProps } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { createLocalTrack } from '../../base/lib-jitsi-meet';

import AudioInputPreview from './AudioInputPreview';
import AudioOutputPreview from './AudioOutputPreview';
import DeviceSelector from './DeviceSelector';
import VideoInputPreview from './VideoInputPreview';

/**
 * The type of the React {@code Component} props of {@link DeviceSelection}.
 */
export type Props = {
    ...$Exact<AbstractDialogTabProps>,

    /**
     * All known audio and video devices split by type. This prop comes from
     * the app state.
     */
    availableDevices: Object,

    /**
     * Whether or not the audio selector can be interacted with. If true,
     * the audio input selector will be rendered as disabled. This is
     * specifically used to prevent audio device changing in Firefox, which
     * currently does not work due to a browser-side regression.
     */
    disableAudioInputChange: boolean,

    /**
     * True if device changing is configured to be disallowed. Selectors
     * will display as disabled.
     */
    disableDeviceChange: boolean,

    /**
     * Function that checks whether or not a new audio input source can be
     * selected.
     */
    hasAudioPermission: Function,

    /**
     * Function that checks whether or not a new video input sources can be
     * selected.
     */
    hasVideoPermission: Function,

    /**
     * If true, the audio meter will not display. Necessary for browsers or
     * configurations that do not support local stats to prevent a
     * non-responsive mic preview from displaying.
     */
    hideAudioInputPreview: boolean,

    /**
     * Whether or not the audio output source selector should display. If
     * true, the audio output selector and test audio link will not be
     * rendered.
     */
    hideAudioOutputSelect: boolean,

    /**
     * The id of the audio input device to preview.
     */
    selectedAudioInputId: string,

    /**
     * The id of the audio output device to preview.
     */
    selectedAudioOutputId: string,

    /**
     * The id of the video input device to preview.
     */
    selectedVideoInputId: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link DeviceSelection}.
 */
type State = {

    /**
     * The JitsiTrack to use for previewing audio input.
     */
    previewAudioTrack: ?Object,

    /**
     * The JitsiTrack to use for previewing video input.
     */
    previewVideoTrack: ?Object,

    /**
     * The error message from trying to use a video input device.
     */
    previewVideoTrackError: ?string
};

/**
 * React {@code Component} for previewing audio and video input/output devices.
 *
 * @extends Component
 */
class DeviceSelection extends AbstractDialogTab<Props, State> {
    /**
     * Initializes a new DeviceSelection instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            previewAudioTrack: null,
            previewVideoTrack: null,
            previewVideoTrackError: null
        };
    }

    /**
     * Generate the initial previews for audio input and video input.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._createAudioInputTrack(this.props.selectedAudioInputId);
        this._createVideoInputTrack(this.props.selectedVideoInputId);
    }

    /**
     * Updates audio input and video input previews.
     *
     * @inheritdoc
     * @param {Object} nextProps - The read-only props which this Component will
     * receive.
     * @returns {void}
     */
    componentWillReceiveProps(nextProps: Object) {
        const { selectedAudioInputId, selectedVideoInputId } = this.props;

        if (selectedAudioInputId !== nextProps.selectedAudioInputId) {
            this._createAudioInputTrack(nextProps.selectedAudioInputId);
        }

        if (selectedVideoInputId !== nextProps.selectedVideoInputId) {
            this._createVideoInputTrack(nextProps.selectedVideoInputId);
        }
    }

    /**
     * Ensure preview tracks are destroyed to prevent continued use.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._disposeAudioInputPreview();
        this._disposeVideoInputPreview();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const {
            hideAudioInputPreview,
            hideAudioOutputSelect,
            selectedAudioOutputId
        } = this.props;

        return (
            <div className = 'device-selection'>
                <div className = 'device-selection-column column-video'>
                    <div className = 'device-selection-video-container'>
                        <VideoInputPreview
                            error = { this.state.previewVideoTrackError }
                            track = { this.state.previewVideoTrack } />
                    </div>
                    { !hideAudioInputPreview
                        && <AudioInputPreview
                            track = { this.state.previewAudioTrack } /> }
                </div>
                <div className = 'device-selection-column column-selectors'>
                    <div className = 'device-selectors'>
                        { this._renderSelectors() }
                    </div>
                    { !hideAudioOutputSelect
                        && <AudioOutputPreview
                            deviceId = { selectedAudioOutputId } /> }
                </div>
            </div>
        );
    }

    /**
     * Creates the JitiTrack for the audio input preview.
     *
     * @param {string} deviceId - The id of audio input device to preview.
     * @private
     * @returns {void}
     */
    _createAudioInputTrack(deviceId) {
        this._disposeAudioInputPreview()
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
    }

    /**
     * Creates the JitiTrack for the video input preview.
     *
     * @param {string} deviceId - The id of video device to preview.
     * @private
     * @returns {void}
     */
    _createVideoInputTrack(deviceId) {
        this._disposeVideoInputPreview()
            .then(() => createLocalTrack('video', deviceId))
            .then(jitsiLocalTrack => {
                if (!jitsiLocalTrack) {
                    return Promise.reject();
                }

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
    }

    /**
     * Utility function for disposing the current audio input preview.
     *
     * @private
     * @returns {Promise}
     */
    _disposeAudioInputPreview(): Promise<*> {
        return this.state.previewAudioTrack
            ? this.state.previewAudioTrack.dispose() : Promise.resolve();
    }

    /**
     * Utility function for disposing the current video input preview.
     *
     * @private
     * @returns {Promise}
     */
    _disposeVideoInputPreview(): Promise<*> {
        return this.state.previewVideoTrack
            ? this.state.previewVideoTrack.dispose() : Promise.resolve();
    }

    /**
     * Creates a DeviceSelector instance based on the passed in configuration.
     *
     * @private
     * @param {Object} deviceSelectorProps - The props for the DeviceSelector.
     * @returns {ReactElement}
     */
    _renderSelector(deviceSelectorProps) {
        return (
            <div key = { deviceSelectorProps.label }>
                <div className = 'device-selector-label'>
                    { this.props.t(deviceSelectorProps.label) }
                </div>
                <DeviceSelector { ...deviceSelectorProps } />
            </div>
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
        const { availableDevices } = this.props;

        const configurations = [
            {
                devices: availableDevices.videoInput,
                hasPermission: this.props.hasVideoPermission(),
                icon: 'icon-camera',
                isDisabled: this.props.disableDeviceChange,
                key: 'videoInput',
                label: 'settings.selectCamera',
                onSelect: selectedVideoInputId =>
                    super._onChange({ selectedVideoInputId }),
                selectedDeviceId: this.props.selectedVideoInputId
            },
            {
                devices: availableDevices.audioInput,
                hasPermission: this.props.hasAudioPermission(),
                icon: 'icon-microphone',
                isDisabled: this.props.disableAudioInputChange
                    || this.props.disableDeviceChange,
                key: 'audioInput',
                label: 'settings.selectMic',
                onSelect: selectedAudioInputId =>
                    super._onChange({ selectedAudioInputId }),
                selectedDeviceId: this.props.selectedAudioInputId
            }
        ];

        if (!this.props.hideAudioOutputSelect) {
            configurations.push({
                devices: availableDevices.audioOutput,
                hasPermission: this.props.hasAudioPermission()
                    || this.props.hasVideoPermission(),
                icon: 'icon-volume',
                isDisabled: this.props.disableDeviceChange,
                key: 'audioOutput',
                label: 'settings.selectAudioOutput',
                onSelect: selectedAudioOutputId =>
                    super._onChange({ selectedAudioOutputId }),
                selectedDeviceId: this.props.selectedAudioOutputId
            });
        }

        return configurations.map(config => this._renderSelector(config));
    }
}

export default translate(DeviceSelection);
