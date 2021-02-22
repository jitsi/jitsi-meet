// @flow

import React from 'react';

import AbstractDialogTab, {
    type Props as AbstractDialogTabProps
} from '../../base/dialog/components/web/AbstractDialogTab';
import { translate } from '../../base/i18n/functions';
import JitsiMeetJS from '../../base/lib-jitsi-meet/_';
import { createLocalTrack } from '../../base/lib-jitsi-meet/functions';
import logger from '../logger';

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
     * An optional callback to invoke after the component has completed its
     * mount logic.
     */
    mountCallback?: Function,

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
     * Whether or not the audio permission was granted.
     */
    hasAudioPermission: boolean,

    /**
     * Whether or not the audio permission was granted.
     */
    hasVideoPermission: boolean,

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
     * Whether current component is mounted or not.
     *
     * In component did mount we start a Promise to create tracks and
     * set the tracks in the state, if we unmount the component in the meanwhile
     * tracks will be created and will never been disposed (dispose tracks is
     * in componentWillUnmount). When tracks are created and component is
     * unmounted we dispose the tracks.
     */
    _unMounted: boolean;

    /**
     * Initializes a new DeviceSelection instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            hasAudioPermission: false,
            hasVideoPermission: false,
            previewAudioTrack: null,
            previewVideoTrack: null,
            previewVideoTrackError: null
        };
        this._unMounted = true;
    }

    /**
     * Generate the initial previews for audio input and video input.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._unMounted = false;
        Promise.all([
            this._createAudioInputTrack(this.props.selectedAudioInputId),
            this._createVideoInputTrack(this.props.selectedVideoInputId)
        ])
        .catch(err => logger.warn('Failed to initialize preview tracks', err))
        .then(() => this.props.mountCallback && this.props.mountCallback());
    }

    /**
     * Checks if audio / video permissions were granted. Updates audio input and
     * video input previews.
     *
     * @param {Object} prevProps - Previous props this component received.
     * @param {Object} prevState - Previous state this component had.
     * @returns {void}
     */
    componentDidUpdate(prevProps, prevState) {
        const { previewAudioTrack, previewVideoTrack } = prevState;

        if ((!previewAudioTrack && this.state.previewAudioTrack)
                || (!previewVideoTrack && this.state.previewVideoTrack)) {
            Promise.all([
                JitsiMeetJS.mediaDevices.isDevicePermissionGranted('audio'),
                JitsiMeetJS.mediaDevices.isDevicePermissionGranted('video')
            ]).then(r => {
                const [ hasAudioPermission, hasVideoPermission ] = r;

                this.setState({
                    hasAudioPermission,
                    hasVideoPermission
                });
            });
        }

        if (prevProps.selectedAudioInputId
            !== this.props.selectedAudioInputId) {
            this._createAudioInputTrack(this.props.selectedAudioInputId);
        }

        if (prevProps.selectedVideoInputId
            !== this.props.selectedVideoInputId) {
            this._createVideoInputTrack(this.props.selectedVideoInputId);
        }
    }

    /**
     * Ensure preview tracks are destroyed to prevent continued use.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._unMounted = true;
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
        return this._disposeAudioInputPreview()
            .then(() => createLocalTrack('audio', deviceId))
            .then(jitsiLocalTrack => {
                if (this._unMounted) {
                    jitsiLocalTrack.dispose();

                    return;
                }

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
        return this._disposeVideoInputPreview()
            .then(() => createLocalTrack('video', deviceId))
            .then(jitsiLocalTrack => {
                if (!jitsiLocalTrack) {
                    return Promise.reject();
                }

                if (this._unMounted) {
                    jitsiLocalTrack.dispose();

                    return;
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
        const { hasAudioPermission, hasVideoPermission } = this.state;

        const configurations = [
            {
                devices: availableDevices.videoInput,
                hasPermission: hasVideoPermission,
                icon: 'icon-camera',
                isDisabled: this.props.disableDeviceChange,
                key: 'videoInput',
                label: 'settings.selectCamera',
                onSelect: selectedVideoInputId =>
                    super._onChange({ selectedVideoInputId }),
                selectedDeviceId: this.state.previewVideoTrack
                    ? this.state.previewVideoTrack.getDeviceId() : null
            },
            {
                devices: availableDevices.audioInput,
                hasPermission: hasAudioPermission,
                icon: 'icon-microphone',
                isDisabled: this.props.disableAudioInputChange
                    || this.props.disableDeviceChange,
                key: 'audioInput',
                label: 'settings.selectMic',
                onSelect: selectedAudioInputId =>
                    super._onChange({ selectedAudioInputId }),
                selectedDeviceId: this.state.previewAudioTrack
                    ? this.state.previewAudioTrack.getDeviceId() : null
            }
        ];

        if (!this.props.hideAudioOutputSelect) {
            configurations.push({
                devices: availableDevices.audioOutput,
                hasPermission: hasAudioPermission || hasVideoPermission,
                icon: 'icon-speaker',
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
