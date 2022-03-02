// @flow

import { withStyles } from '@material-ui/styles';
import clsx from 'clsx';
import React from 'react';

import AbstractDialogTab, {
    type Props as AbstractDialogTabProps
} from '../../base/dialog/components/web/AbstractDialogTab';
import { translate } from '../../base/i18n/functions';
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
     * An object containing the CSS classes.
     */
    classes: Object,

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
     * Whether video input dropdown should be enabled or not.
     */
    disableVideoInputSelect: boolean,

    /**
     * Whether or not the audio permission was granted.
     */
    hasAudioPermission: boolean,

    /**
     * Whether or not the audio permission was granted.
     */
    hasVideoPermission: boolean,

    /**
     * If true, the audio meter will not display. Necessary for browsers or
     * configurations that do not support local stats to prevent a
     * non-responsive mic preview from displaying.
     */
    hideAudioInputPreview: boolean,

    /**
     * If true, the button to play a test sound on the selected speaker will not be displayed.
     * This needs to be hidden on browsers that do not support selecting an audio output device.
     */
    hideAudioOutputPreview: boolean,

    /**
     * Whether or not the audio output source selector should display. If
     * true, the audio output selector and test audio link will not be
     * rendered.
     */
    hideAudioOutputSelect: boolean,

    /**
     * Whether video input preview should be displayed or not.
     * (In the case of iOS Safari).
     */
    hideVideoInputPreview: boolean,

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
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = theme => {
    return {
        root: {
            '& .device-selectors': {
                fontSize: '14px',

                '& > div': {
                    display: 'block',
                    marginBottom: theme.spacing(1)
                },

                '& .device-selector-icon': {
                    alignSelf: 'center',
                    color: 'inherit',
                    fontSize: '20px',
                    marginLeft: '3px'
                },

                '& .device-selector-label': {
                    marginBottom: '1px'
                },

                /* device-selector-trigger stylings attempt to mimic AtlasKit button */
                '& .device-selector-trigger': {
                    backgroundColor: '#0E1624',
                    border: '1px solid #455166',
                    borderRadius: '5px',
                    display: 'flex',
                    height: '2.3em',
                    justifyContent: 'space-between',
                    lineHeight: '2.3em',
                    overflow: 'hidden',
                    padding: `0 ${theme.spacing(1)}`
                },

                '& .device-selector-trigger-disabled': {
                    '& .device-selector-trigger': {
                        color: '#a5adba',
                        cursor: 'default'
                    }
                },

                '& .device-selector-trigger-text': {
                    overflow: 'hidden',
                    textAlign: 'center',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%'
                }
            },

            '& .device-selection-column': {
                boxSizing: 'border-box',
                display: 'inline-block',
                verticalAlign: 'top',

                '&.column-selectors': {
                    marginLeft: '15px',
                    width: '45%'
                },

                '&.column-video': {
                    width: '50%'
                }
            },

            '& .device-selection-video-container': {
                borderRadius: '3px',
                marginBottom: '5px',

                '& .video-input-preview': {
                    marginTop: '2px',
                    position: 'relative',

                    '& > video': {
                        borderRadius: '3px'
                    },

                    '& .video-input-preview-error': {
                        color: 'var(--participant-name-color)',
                        display: 'none',
                        left: 0,
                        position: 'absolute',
                        right: 0,
                        textAlign: 'center',
                        top: '50%'
                    },

                    '&.video-preview-has-error': {
                        background: 'black',

                        '& .video-input-preview-error': {
                            display: 'block'
                        }
                    },

                    '& .video-input-preview-display': {
                        height: 'auto',
                        overflow: 'hidden',
                        width: '100%'
                    }
                }
            },

            '& .audio-output-preview': {
                fontSize: '14px',

                '& a': {
                    color: '#6FB1EA',
                    cursor: 'pointer',
                    textDecoration: 'none'
                },

                '& a:hover': {
                    color: '#B3D4FF'
                }
            },

            '& .audio-input-preview': {
                background: '#1B2638',
                borderRadius: '5px',
                height: '8px',

                '& .audio-input-preview-level': {
                    background: '#75B1FF',
                    borderRadius: '5px',
                    height: '100%',
                    transition: 'width .1s ease-in-out'
                }
            }
        }
    };
};

/**
 * React {@code Component} for previewing audio and video input/output devices.
 *
 * @augments Component
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
     * @returns {void}
     */
    componentDidUpdate(prevProps) {
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
            classes,
            hideAudioInputPreview,
            hideAudioOutputPreview,
            hideVideoInputPreview,
            selectedAudioOutputId
        } = this.props;

        return (
            <div className = { clsx('device-selection', classes.root, { 'video-hidden': hideVideoInputPreview }) }>
                <div className = 'device-selection-column column-video'>
                    { !hideVideoInputPreview
                        && <div className = 'device-selection-video-container'>
                            <VideoInputPreview
                                error = { this.state.previewVideoTrackError }
                                track = { this.state.previewVideoTrack } />
                        </div>
                    }
                    { !hideAudioInputPreview
                        && <AudioInputPreview
                            track = { this.state.previewAudioTrack } /> }
                </div>
                <div className = 'device-selection-column column-selectors'>
                    <div
                        aria-live = 'polite all'
                        className = 'device-selectors'>
                        { this._renderSelectors() }
                    </div>
                    { !hideAudioOutputPreview
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
        const { hideAudioInputPreview } = this.props;

        if (hideAudioInputPreview) {
            return;
        }

        return this._disposeAudioInputPreview()
            .then(() => createLocalTrack('audio', deviceId, 5000))
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
        const { hideVideoInputPreview } = this.props;

        if (hideVideoInputPreview) {
            return;
        }

        return this._disposeVideoInputPreview()
            .then(() => createLocalTrack('video', deviceId, 5000))
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
                <label
                    className = 'device-selector-label'
                    htmlFor = { deviceSelectorProps.id }>
                    { this.props.t(deviceSelectorProps.label) }
                </label>
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
        const { availableDevices, hasAudioPermission, hasVideoPermission } = this.props;

        const configurations = [
            {
                devices: availableDevices.audioInput,
                hasPermission: hasAudioPermission,
                icon: 'icon-microphone',
                isDisabled: this.props.disableAudioInputChange || this.props.disableDeviceChange,
                key: 'audioInput',
                id: 'audioInput',
                label: 'settings.selectMic',
                onSelect: selectedAudioInputId => super._onChange({ selectedAudioInputId }),
                selectedDeviceId: this.state.previewAudioTrack
                    ? this.state.previewAudioTrack.getDeviceId() : this.props.selectedAudioInputId
            },
            {
                devices: availableDevices.videoInput,
                hasPermission: hasVideoPermission,
                icon: 'icon-camera',
                isDisabled: this.props.disableVideoInputSelect || this.props.disableDeviceChange,
                key: 'videoInput',
                id: 'videoInput',
                label: 'settings.selectCamera',
                onSelect: selectedVideoInputId => super._onChange({ selectedVideoInputId }),
                selectedDeviceId: this.state.previewVideoTrack
                    ? this.state.previewVideoTrack.getDeviceId() : this.props.selectedVideoInputId
            }
        ];

        if (!this.props.hideAudioOutputSelect) {
            configurations.push({
                devices: availableDevices.audioOutput,
                hasPermission: hasAudioPermission || hasVideoPermission,
                icon: 'icon-speaker',
                isDisabled: this.props.disableDeviceChange,
                key: 'audioOutput',
                id: 'audioOutput',
                label: 'settings.selectAudioOutput',
                onSelect: selectedAudioOutputId => super._onChange({ selectedAudioOutputId }),
                selectedDeviceId: this.props.selectedAudioOutputId
            });
        }

        return configurations.map(config => this._renderSelector(config));
    }
}

export default translate(withStyles(styles)(DeviceSelection));
